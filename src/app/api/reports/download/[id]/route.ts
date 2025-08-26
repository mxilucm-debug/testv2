import { NextRequest, NextResponse } from 'next/server'

// This is a mock download endpoint
// In a real application, this would serve actual files from storage
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Mock file data based on the report ID
    const mockFiles: Record<string, { filename: string; content: string; contentType: string }> = {
      '1': {
        filename: 'leave_report_june_2025.pdf',
        content: JSON.stringify({
          summary: {
            totalRequests: 45,
            approvedRequests: 32,
            pendingRequests: 8,
            rejectedRequests: 5,
            totalLeaveDays: 127
          },
          data: [
            {
              employeeName: 'John Employee',
              department: 'Engineering',
              leaveType: 'Casual Leave',
              startDate: '2025-06-01',
              endDate: '2025-06-03',
              days: 3,
              status: 'approved'
            }
          ]
        }, null, 2),
        contentType: 'application/json'
      },
      '2': {
        filename: 'attendance_q2_2025.xlsx',
        content: 'Employee ID,Name,Department,Punch In,Punch Out,Status\nEMP001,John Employee,Engineering,2025-06-20T09:00:00Z,2025-06-20T18:00:00Z,Present',
        contentType: 'text/csv'
      },
      '5': {
        filename: 'error_logs_june_2025.txt',
        content: `Error Logs Report - Generated: 2025-06-20T10:30:00.000Z

Summary:
  totalLogs: 3
  criticalErrors: 1
  highSeverity: 1
  mediumSeverity: 1
  lowSeverity: 0
  resolvedLogs: 1
  unresolvedLogs: 2

Data:

Record 1:
  id: 1
  timestamp: 2025-06-20T10:30:00.000Z
  level: ERROR
  message: Database connection failed
  module: database
  severity: high
  stackTrace: Error: Connection timeout
    at Database.connect (/app/src/lib/db.ts:45:12)
  userId: user-1
  resolved: false

Record 2:
  id: 2
  timestamp: 2025-06-20T09:30:00.000Z
  level: WARN
  message: API rate limit approaching
  module: api
  severity: medium
  stackTrace: 
  userId: user-2
  resolved: true

Record 3:
  id: 3
  timestamp: 2025-06-20T08:30:00.000Z
  level: ERROR
  message: Authentication failed
  module: auth
  severity: critical
  stackTrace: Error: Invalid token
    at AuthMiddleware (/app/src/middleware/auth.ts:23:8)
  userId: user-3
  resolved: false`,
        contentType: 'text/plain'
      }
    }

    const file = mockFiles[id]
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Create response with download headers
    const response = new NextResponse(file.content, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.content.length.toString(),
      },
    })

    return response

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}