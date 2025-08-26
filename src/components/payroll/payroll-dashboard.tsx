"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PayrollForm } from "./payroll-form"
import { PayrollList } from "./payroll-list"
import { PayrollStats } from "./payroll-stats"
import { PayrollReports } from "./payroll-reports"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { DollarSign, Users, TrendingUp, FileText, Plus } from "lucide-react"

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

export function PayrollDashboard() {
  const [payrollData, setPayrollData] = useState<PayrollInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll')
      if (response.ok) {
        const data = await response.json()
        setPayrollData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payroll data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payroll data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrollData()
  }, [])

  const handlePayrollUpdated = (updatedPayroll: PayrollInfo) => {
    setPayrollData(prev => prev.map(payroll => 
      payroll.userId === updatedPayroll.userId ? updatedPayroll : payroll
    ))
    toast({
      title: "Success",
      description: "Payroll information updated successfully"
    })
  }

  const handlePayrollCreated = (newPayroll: PayrollInfo) => {
    setPayrollData(prev => [...prev, newPayroll])
    toast({
      title: "Success",
      description: "Payroll information created successfully"
    })
  }

  const handlePayrollDeleted = (userId: string) => {
    setPayrollData(prev => prev.filter(payroll => payroll.userId !== userId))
    toast({
      title: "Success",
      description: "Payroll information deleted successfully"
    })
  }

  const canManagePayroll = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const myPayroll = payrollData.find(payroll => payroll.userId === user?.id)

  const getPayrollStats = () => {
    const totalEmployees = payrollData.length
    const totalPayroll = payrollData.reduce((sum, payroll) => 
      sum + (payroll.salaryBreakdown?.netSalary || 0), 0
    )
    const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0
    const totalTax = payrollData.reduce((sum, payroll) => 
      sum + (payroll.salaryBreakdown?.tax || 0), 0
    )

    return {
      totalEmployees,
      totalPayroll,
      avgSalary,
      totalTax
    }
  }

  const stats = getPayrollStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage employee salaries, compensation, and payroll processing
          </p>
        </div>
        {canManagePayroll && (
          <PayrollForm onPayrollCreated={handlePayrollCreated} />
        )}
      </div>

      <PayrollStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employee-payroll">Employee Payroll</TabsTrigger>
          {canManagePayroll && (
            <TabsTrigger value="reports">Reports</TabsTrigger>
          )}
          {myPayroll && (
            <TabsTrigger value="my-salary">My Salary</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>
                  Overview of payroll information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Employees</span>
                    <Badge variant="secondary">{stats.totalEmployees}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Monthly Payroll</span>
                    <Badge variant="secondary">₹{stats.totalPayroll.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Salary</span>
                    <Badge variant="secondary">₹{stats.avgSalary.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Tax Deducted</span>
                    <Badge variant="secondary">₹{stats.totalTax.toLocaleString()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common payroll tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {canManagePayroll && (
                  <>
                    <PayrollForm onPayrollCreated={handlePayrollCreated} />
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Payslips
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Export Payroll Report
                    </Button>
                  </>
                )}
                {myPayroll && (
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View My Payslip
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employee-payroll">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll</CardTitle>
              <CardDescription>
                View and manage payroll information for all employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollList
                payrollData={payrollData}
                onPayrollUpdated={handlePayrollUpdated}
                onPayrollDeleted={handlePayrollDeleted}
                canEdit={canManagePayroll}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canManagePayroll && (
          <TabsContent value="reports">
            <PayrollReports payrollData={payrollData} />
          </TabsContent>
        )}

        {myPayroll && (
          <TabsContent value="my-salary">
            <Card>
              <CardHeader>
                <CardTitle>My Salary Information</CardTitle>
                <CardDescription>
                  View your salary details and breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Employee Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Name:</span> {myPayroll.user.name}</div>
                        <div><span className="font-medium">Employee ID:</span> {myPayroll.user.employeeId}</div>
                        <div><span className="font-medium">Department:</span> {myPayroll.user.department?.name}</div>
                        <div><span className="font-medium">Designation:</span> {myPayroll.user.designation?.name}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Bank Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Bank:</span> {myPayroll.bankName}</div>
                        <div><span className="font-medium">Account:</span> {myPayroll.bankAccount}</div>
                        <div><span className="font-medium">IFSC:</span> {myPayroll.bankIfsc}</div>
                        <div><span className="font-medium">Tax Regime:</span> {myPayroll.taxRegime?.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>

                  {myPayroll.salaryBreakdown && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Salary Breakdown</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Basic Salary</span>
                            <span>₹{myPayroll.salaryBreakdown.basic.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HRA</span>
                            <span>₹{myPayroll.salaryBreakdown.hra.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other Allowances</span>
                            <span>₹{myPayroll.salaryBreakdown.allowances.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Gross Salary</span>
                            <span>₹{myPayroll.salaryBreakdown.grossSalary.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Tax Deducted</span>
                            <span>₹{myPayroll.salaryBreakdown.tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Net Salary</span>
                            <span className="text-green-600">₹{myPayroll.salaryBreakdown.netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}