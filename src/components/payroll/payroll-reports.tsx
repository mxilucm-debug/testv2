"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, TrendingUp, DollarSign, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayrollInfo {
  id: string
  userId: string
  bankAccount?: string
  bankIfsc?: string
  bankName?: string
  taxRegime?: string
  basicSalary?: number
  hra?: number
  otherAllowances?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    employeeId?: string
    department?: {
      name: string
    }
    designation?: {
      name: string
    }
  }
  salaryBreakdown?: {
    basic: number
    hra: number
    allowances: number
    grossSalary: number
    tax: number
    netSalary: number
    taxRegime: string
  }
}

interface PayrollReportsProps {
  payrollData: PayrollInfo[]
}

export function PayrollReports({ payrollData }: PayrollReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const { toast } = useToast()

  // Calculate department-wise statistics
  const departmentStats = payrollData.reduce((acc, payroll) => {
    const dept = payroll.user.department?.name || 'Unassigned'
    if (!acc[dept]) {
      acc[dept] = {
        employeeCount: 0,
        totalSalary: 0,
        totalTax: 0,
        avgSalary: 0
      }
    }
    acc[dept].employeeCount++
    acc[dept].totalSalary += payroll.salaryBreakdown?.netSalary || 0
    acc[dept].totalTax += payroll.salaryBreakdown?.tax || 0
    return acc
  }, {} as Record<string, any>)

  // Calculate average salary for each department
  Object.keys(departmentStats).forEach(dept => {
    departmentStats[dept].avgSalary = departmentStats[dept].totalSalary / departmentStats[dept].employeeCount
  })

  // Calculate tax regime statistics
  const taxRegimeStats = payrollData.reduce((acc, payroll) => {
    const regime = payroll.taxRegime || 'old'
    if (!acc[regime]) {
      acc[regime] = {
        employeeCount: 0,
        totalSalary: 0,
        totalTax: 0
      }
    }
    acc[regime].employeeCount++
    acc[regime].totalSalary += payroll.salaryBreakdown?.netSalary || 0
    acc[regime].totalTax += payroll.salaryBreakdown?.tax || 0
    return acc
  }, {} as Record<string, any>)

  // Calculate salary range statistics
  const salaryRanges = [
    { label: 'Below ₹25,000', min: 0, max: 25000 },
    { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
    { label: '₹50,000 - ₹75,000', min: 50000, max: 75000 },
    { label: '₹75,000 - ₹1,00,000', min: 75000, max: 100000 },
    { label: 'Above ₹1,00,000', min: 100000, max: Infinity }
  ]

  const salaryRangeStats = salaryRanges.map(range => {
    const employees = payrollData.filter(payroll => {
      const salary = payroll.salaryBreakdown?.netSalary || 0
      return salary >= range.min && salary < range.max
    })
    return {
      ...range,
      employeeCount: employees.length,
      totalSalary: employees.reduce((sum, emp) => sum + (emp.salaryBreakdown?.netSalary || 0), 0)
    }
  })

  const totalStats = {
    totalEmployees: payrollData.length,
    totalPayroll: payrollData.reduce((sum, payroll) => sum + (payroll.salaryBreakdown?.netSalary || 0), 0),
    totalTax: payrollData.reduce((sum, payroll) => sum + (payroll.salaryBreakdown?.tax || 0), 0),
    avgSalary: payrollData.length > 0 ? payrollData.reduce((sum, payroll) => sum + (payroll.salaryBreakdown?.netSalary || 0), 0) / payrollData.length : 0
  }

  const exportReport = (type: string) => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,"
      let filename = ""
      
      switch (type) {
        case 'summary':
          filename = `payroll-summary-report-${new Date().toISOString().split('T')[0]}.csv`
          csvContent += "Payroll Summary Report\n"
          csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`
          csvContent += "Total Employees," + payrollData.length + "\n"
          csvContent += "Total Monthly Payroll," + totalStats.totalPayroll + "\n"
          csvContent += "Average Salary," + totalStats.avgSalary + "\n"
          csvContent += "Total Tax Deducted," + totalStats.totalTax + "\n"
          break
          
        case 'detailed':
          filename = `payroll-detailed-report-${new Date().toISOString().split('T')[0]}.csv`
          csvContent += "Detailed Payroll Report\n"
          csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`
          csvContent += "Employee Name,Employee ID,Department,Basic Salary,HRA,Other Allowances,Gross Salary,Tax,Net Salary,Tax Regime,Bank Name\n"
          payrollData.forEach(payroll => {
            csvContent += `${payroll.user.name},${payroll.user.employeeId || 'N/A'},${payroll.user.department?.name || 'N/A'},${payroll.basicSalary || 0},${payroll.hra || 0},${payroll.otherAllowances || 0},${payroll.salaryBreakdown?.grossSalary || 0},${payroll.salaryBreakdown?.tax || 0},${payroll.salaryBreakdown?.netSalary || 0},${payroll.taxRegime || 'old'},${payroll.bankName || 'N/A'}\n`
          })
          break
          
        case 'tax':
          filename = `payroll-tax-report-${new Date().toISOString().split('T')[0]}.csv`
          csvContent += "Tax Analysis Report\n"
          csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`
          csvContent += "Employee Name,Employee ID,Department,Gross Salary,Tax Deducted,Tax Regime,Effective Tax Rate\n"
          payrollData.forEach(payroll => {
            const grossSalary = payroll.salaryBreakdown?.grossSalary || 0
            const tax = payroll.salaryBreakdown?.tax || 0
            const effectiveRate = grossSalary > 0 ? ((tax / grossSalary) * 100).toFixed(2) : 0
            csvContent += `${payroll.user.name},${payroll.user.employeeId || 'N/A'},${payroll.user.department?.name || 'N/A'},${grossSalary},${tax},${payroll.taxRegime || 'old'},${effectiveRate}%\n`
          })
          break
          
        case 'bank':
          filename = `payroll-bank-report-${new Date().toISOString().split('T')[0]}.csv`
          csvContent += "Bank Information Report\n"
          csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`
          csvContent += "Employee Name,Employee ID,Department,Bank Name,Bank Account,IFSC Code,Net Salary\n"
          payrollData.forEach(payroll => {
            csvContent += `${payroll.user.name},${payroll.user.employeeId || 'N/A'},${payroll.user.department?.name || 'N/A'},${payroll.bankName || 'N/A'},${payroll.bankAccount || 'N/A'},${payroll.bankIfsc || 'N/A'},${payroll.salaryBreakdown?.netSalary || 0}\n`
          })
          break
      }
      
      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} report has been downloaded successfully`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export payroll report",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive payroll analytics and reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="department">Department-wise</TabsTrigger>
          <TabsTrigger value="tax-regime">Tax Regime</TabsTrigger>
          <TabsTrigger value="salary-ranges">Salary Ranges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalStats.totalPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Monthly payroll expense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalStats.avgSalary.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Average monthly salary
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalStats.totalTax.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total tax deduction
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Download detailed payroll reports in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => exportReport('summary')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Summary Report
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => exportReport('detailed')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Detailed Report
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => exportReport('tax')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Tax Report
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => exportReport('bank')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Bank Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Payroll Analysis</CardTitle>
              <CardDescription>
                Payroll distribution across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Salary</TableHead>
                    <TableHead>Average Salary</TableHead>
                    <TableHead>Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(departmentStats).map(([dept, stats]: [string, any]) => (
                    <TableRow key={dept}>
                      <TableCell className="font-medium">{dept}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stats.employeeCount}</Badge>
                      </TableCell>
                      <TableCell>₹{stats.totalSalary.toLocaleString()}</TableCell>
                      <TableCell>₹{stats.avgSalary.toLocaleString()}</TableCell>
                      <TableCell>₹{stats.totalTax.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax-regime">
          <Card>
            <CardHeader>
              <CardTitle>Tax Regime Analysis</CardTitle>
              <CardDescription>
                Distribution of employees across tax regimes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(taxRegimeStats).map(([regime, stats]: [string, any]) => (
                  <Card key={regime}>
                    <CardHeader>
                      <CardTitle className="text-lg">{regime.toUpperCase()} Regime</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Employees:</span>
                          <Badge variant="secondary">{stats.employeeCount}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Salary:</span>
                          <span>₹{stats.totalSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Tax:</span>
                          <span>₹{stats.totalTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Tax:</span>
                          <span>₹{(stats.totalTax / stats.employeeCount).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-ranges">
          <Card>
            <CardHeader>
              <CardTitle>Salary Range Distribution</CardTitle>
              <CardDescription>
                Employee distribution across salary ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Total Salary</TableHead>
                    <TableHead>Average Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRangeStats.map((range) => {
                    const percentage = totalStats.totalEmployees > 0 
                      ? (range.employeeCount / totalStats.totalEmployees * 100).toFixed(1)
                      : '0'
                    
                    return (
                      <TableRow key={range.label}>
                        <TableCell className="font-medium">{range.label}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{range.employeeCount}</Badge>
                        </TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>₹{range.totalSalary.toLocaleString()}</TableCell>
                        <TableCell>
                          {range.employeeCount > 0 
                            ? `₹${(range.totalSalary / range.employeeCount).toLocaleString()}`
                            : '₹0'
                          }
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}