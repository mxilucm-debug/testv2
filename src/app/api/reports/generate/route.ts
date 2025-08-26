import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, format, filters } = body

    // Validate required fields
    if (!reportType || !format) {
      return NextResponse.json({ error: 'Report type and format are required' }, { status: 400 })
    }

    // Generate report based on type
    let reportData: any = {}
    let filename = ''

    switch (reportType) {
      case 'leave-reports':
        reportData = await generateLeaveReport(filters)
        filename = `leave_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
        break
      
      case 'attendance-reports':
        reportData = await generateAttendanceReport(filters)
        filename = `attendance_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
        break
      
      case 'payroll-reports':
        reportData = await generatePayrollReport(filters)
        filename = `payroll_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
        break
      
      case 'employee-reports':
        reportData = await generateEmployeeReport(filters)
        filename = `employee_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
        break
      
      case 'error-logs':
        reportData = await generateErrorLogsReport(filters)
        filename = `error_logs_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
        break
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Format the response based on the requested format
    let content: string | Blob = ''
    let contentType: string = ''

    switch (format.toLowerCase()) {
      case 'pdf':
        // For PDF, we'll return JSON data that can be converted to PDF on the client side
        content = JSON.stringify(reportData, null, 2)
        contentType = 'application/json'
        break
      
      case 'excel':
      case 'csv':
        content = convertToCSV(reportData)
        contentType = 'text/csv'
        break
      
      case 'json':
        content = JSON.stringify(reportData, null, 2)
        contentType = 'application/json'
        break
      
      case 'txt':
        content = convertToText(reportData)
        contentType = 'text/plain'
        break
      
      default:
        content = JSON.stringify(reportData, null, 2)
        contentType = 'application/json'
    }

    // Create response with download headers
    const response = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    })

    return response

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateLeaveReport(filters: any) {
  const { dateRange, department, leaveType, employee, status } = filters

  let whereClause: any = {}
  
  if (dateRange?.start && dateRange?.end) {
    whereClause.startDate = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    }
  }

  if (status && status !== 'all') {
    whereClause.status = status
  }

  if (leaveType && leaveType !== 'all') {
    whereClause.leaveTypeId = leaveType
  }

  // Build the query with user relationships
  const leaveRequests = await db.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          department: true,
          designation: true
        }
      },
      leaveType: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter by department if specified
  let filteredRequests = leaveRequests
  if (department && department !== 'all') {
    filteredRequests = leaveRequests.filter(request => 
      request.user.department?.name === department
    )
  }

  // Filter by employee if specified
  if (employee && employee !== 'all') {
    filteredRequests = filteredRequests.filter(request => 
      request.user.id === employee
    )
  }

  // Calculate summary statistics
  const summary = {
    totalRequests: filteredRequests.length,
    approvedRequests: filteredRequests.filter(r => r.status === 'approved').length,
    pendingRequests: filteredRequests.filter(r => r.status === 'pending').length,
    rejectedRequests: filteredRequests.filter(r => r.status === 'rejected').length,
    totalLeaveDays: filteredRequests.reduce((sum, request) => {
      const start = new Date(request.startDate)
      const end = new Date(request.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return sum + days
    }, 0)
  }

  return {
    summary,
    filters,
    generatedAt: new Date().toISOString(),
    data: filteredRequests.map(request => ({
      id: request.id,
      employeeName: request.user.name,
      employeeId: request.user.employeeId,
      department: request.user.department?.name || 'N/A',
      designation: request.user.designation?.name || 'N/A',
      leaveType: request.leaveType.name,
      startDate: request.startDate.toISOString().split('T')[0],
      endDate: request.endDate.toISOString().split('T')[0],
      days: Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      reason: request.reason || 'N/A',
      status: request.status,
      approvedBy: request.approvedBy || 'N/A',
      approvedAt: request.approvedAt?.toISOString().split('T')[0] || 'N/A',
      createdAt: request.createdAt.toISOString().split('T')[0]
    }))
  }
}

async function generateAttendanceReport(filters: any) {
  const { dateRange, department, employee, shift, status } = filters

  let whereClause: any = {}
  
  if (dateRange?.start && dateRange?.end) {
    whereClause.punchInTime = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    }
  }

  if (status && status !== 'all') {
    whereClause.status = status
  }

  if (shift && shift !== 'all') {
    whereClause.shiftId = shift
  }

  const attendanceRecords = await db.attendanceRecord.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          department: true,
          designation: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter by department if specified
  let filteredRecords = attendanceRecords
  if (department && department !== 'all') {
    filteredRecords = attendanceRecords.filter(record => 
      record.user.department?.name === department
    )
  }

  // Filter by employee if specified
  if (employee && employee !== 'all') {
    filteredRecords = filteredRecords.filter(record => 
      record.user.id === employee
    )
  }

  // Calculate summary statistics
  const summary = {
    totalRecords: filteredRecords.length,
    presentRecords: filteredRecords.filter(r => r.status === 'present').length,
    absentRecords: filteredRecords.filter(r => r.status === 'absent').length,
    lateRecords: filteredRecords.filter(r => r.status === 'late').length,
    halfDayRecords: filteredRecords.filter(r => r.status === 'half_day').length,
    totalHours: filteredRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0)
  }

  return {
    summary,
    filters,
    generatedAt: new Date().toISOString(),
    data: filteredRecords.map(record => ({
      id: record.id,
      employeeName: record.user.name,
      employeeId: record.user.employeeId,
      department: record.user.department?.name || 'N/A',
      designation: record.user.designation?.name || 'N/A',
      punchInTime: record.punchInTime?.toISOString() || 'N/A',
      punchOutTime: record.punchOutTime?.toISOString() || 'N/A',
      totalHours: record.totalHours || 0,
      status: record.status,
      remarks: record.remarks || 'N/A',
      createdAt: record.createdAt.toISOString().split('T')[0]
    }))
  }
}

async function generatePayrollReport(filters: any) {
  const { dateRange, department, employee, payType, status } = filters

  // For payroll, we'll get user data and calculate payroll information
  let whereClause: any = {
    employmentStatus: 'ACTIVE'
  }

  if (department && department !== 'all') {
    whereClause.department = {
      name: department
    }
  }

  if (employee && employee !== 'all') {
    whereClause.id = employee
  }

  const users = await db.user.findMany({
    where: whereClause,
    include: {
      department: true,
      designation: true,
      payrollInfo: true,
      statutoryInfo: true
    }
  })

  // Calculate payroll data for each user
  const payrollData = users.map(user => {
    // Basic salary calculation (this would be more complex in a real system)
    const basicSalary = user.payrollInfo?.basicSalary || 0
    const hra = user.payrollInfo?.hra || 0
    const otherAllowances = user.payrollInfo?.otherAllowances || 0
    const grossSalary = basicSalary + hra + otherAllowances

    // Simple tax calculation (would be more complex in reality)
    const tax = grossSalary * 0.1 // 10% tax
    const netSalary = grossSalary - tax

    return {
      id: user.id,
      employeeName: user.name,
      employeeId: user.employeeId,
      department: user.department?.name || 'N/A',
      designation: user.designation?.name || 'N/A',
      basicSalary,
      hra,
      otherAllowances,
      grossSalary,
      tax,
      netSalary,
      bankAccount: user.payrollInfo?.bankAccount || 'N/A',
      bankIfsc: user.payrollInfo?.bankIfsc || 'N/A',
      bankName: user.payrollInfo?.bankName || 'N/A',
      pan: user.statutoryInfo?.pan || 'N/A',
      employmentType: user.employmentType,
      dateOfJoining: user.dateOfJoining?.toISOString().split('T')[0] || 'N/A'
    }
  })

  const summary = {
    totalEmployees: payrollData.length,
    totalGrossSalary: payrollData.reduce((sum, emp) => sum + emp.grossSalary, 0),
    totalNetSalary: payrollData.reduce((sum, emp) => sum + emp.netSalary, 0),
    totalTax: payrollData.reduce((sum, emp) => sum + emp.tax, 0),
    averageSalary: payrollData.length > 0 ? payrollData.reduce((sum, emp) => sum + emp.netSalary, 0) / payrollData.length : 0
  }

  return {
    summary,
    filters,
    generatedAt: new Date().toISOString(),
    data: payrollData
  }
}

async function generateEmployeeReport(filters: any) {
  const { department, designation, employmentType, status, dateRange } = filters

  let whereClause: any = {}

  if (department && department !== 'all') {
    whereClause.department = {
      name: department
    }
  }

  if (designation && designation !== 'all') {
    whereClause.designation = {
      name: designation
    }
  }

  if (employmentType && employmentType !== 'all') {
    whereClause.employmentType = employmentType
  }

  if (status && status !== 'all') {
    whereClause.employmentStatus = status
  }

  if (dateRange?.start && dateRange?.end) {
    whereClause.dateOfJoining = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    }
  }

  const employees = await db.user.findMany({
    where: whereClause,
    include: {
      department: true,
      designation: true,
      statutoryInfo: true,
      payrollInfo: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  const summary = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.employmentStatus === 'ACTIVE').length,
    inactiveEmployees: employees.filter(e => e.employmentStatus === 'INACTIVE').length,
    departmentBreakdown: employees.reduce((acc, emp) => {
      const dept = emp.department?.name || 'Unassigned'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return {
    summary,
    filters,
    generatedAt: new Date().toISOString(),
    data: employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      employeeId: emp.employeeId,
      email: emp.email,
      department: emp.department?.name || 'N/A',
      designation: emp.designation?.name || 'N/A',
      employmentType: emp.employmentType,
      employmentStatus: emp.employmentStatus,
      dateOfJoining: emp.dateOfJoining?.toISOString().split('T')[0] || 'N/A',
      contactNumber: emp.contactNumber || 'N/A',
      gender: emp.gender || 'N/A',
      workLocation: emp.workLocation || 'N/A',
      pan: emp.statutoryInfo?.pan || 'N/A',
      aadhaar: emp.statutoryInfo?.aadhaar || 'N/A',
      bankAccount: emp.payrollInfo?.bankAccount || 'N/A',
      bankName: emp.payrollInfo?.bankName || 'N/A'
    }))
  }
}

async function generateErrorLogsReport(filters: any) {
  const { dateRange, errorType, severity, module, status } = filters

  // Mock error logs data (in a real system, this would come from a logging table)
  const mockErrorLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Database connection failed',
      module: 'database',
      severity: 'high',
      stackTrace: 'Error: Connection timeout\n    at Database.connect (/app/src/lib/db.ts:45:12)',
      userId: 'user-1',
      resolved: false
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      level: 'WARN',
      message: 'API rate limit approaching',
      module: 'api',
      severity: 'medium',
      stackTrace: '',
      userId: 'user-2',
      resolved: true
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      level: 'ERROR',
      message: 'Authentication failed',
      module: 'auth',
      severity: 'critical',
      stackTrace: 'Error: Invalid token\n    at AuthMiddleware (/app/src/middleware/auth.ts:23:8)',
      userId: 'user-3',
      resolved: false
    }
  ]

  // Filter based on provided filters
  let filteredLogs = mockErrorLogs

  if (dateRange?.start && dateRange?.end) {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= startDate && logDate <= endDate
    })
  }

  if (severity && severity !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.severity === severity)
  }

  if (module && module !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.module === module)
  }

  if (status && status !== 'all') {
    filteredLogs = filteredLogs.filter(log => 
      status === 'resolved' ? log.resolved : !log.resolved
    )
  }

  const summary = {
    totalLogs: filteredLogs.length,
    criticalErrors: filteredLogs.filter(l => l.severity === 'critical').length,
    highSeverity: filteredLogs.filter(l => l.severity === 'high').length,
    mediumSeverity: filteredLogs.filter(l => l.severity === 'medium').length,
    lowSeverity: filteredLogs.filter(l => l.severity === 'low').length,
    resolvedLogs: filteredLogs.filter(l => l.resolved).length,
    unresolvedLogs: filteredLogs.filter(l => !l.resolved).length
  }

  return {
    summary,
    filters,
    generatedAt: new Date().toISOString(),
    data: filteredLogs
  }
}

function convertToCSV(data: any): string {
  if (!data.data || !Array.isArray(data.data)) {
    return 'No data available'
  }

  const headers = Object.keys(data.data[0] || {})
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(','))

  // Add data rows
  for (const row of data.data) {
    const values = headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

function convertToText(data: any): string {
  let text = `Report Generated: ${data.generatedAt}\n`
  text += `Filters: ${JSON.stringify(data.filters, null, 2)}\n\n`
  
  if (data.summary) {
    text += 'Summary:\n'
    for (const [key, value] of Object.entries(data.summary)) {
      text += `  ${key}: ${value}\n`
    }
    text += '\n'
  }

  if (data.data && Array.isArray(data.data)) {
    text += 'Data:\n'
    data.data.forEach((item, index) => {
      text += `\nRecord ${index + 1}:\n`
      for (const [key, value] of Object.entries(item)) {
        text += `  ${key}: ${value}\n`
      }
    })
  }

  return text
}