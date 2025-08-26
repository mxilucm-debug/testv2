"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Eye, Edit, Trash2, Search, Filter, DollarSign } from "lucide-react"

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

interface PayrollListProps {
  payrollData: PayrollInfo[]
  onPayrollUpdated: (payroll: PayrollInfo) => void
  onPayrollDeleted: (userId: string) => void
  canEdit: boolean
}

export function PayrollList({ payrollData, onPayrollUpdated, onPayrollDeleted, canEdit }: PayrollListProps) {
  const [filteredPayroll, setFilteredPayroll] = useState(payrollData)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [editingPayroll, setEditingPayroll] = useState<PayrollInfo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [payrollToDelete, setPayrollToDelete] = useState<PayrollInfo | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [payrollToView, setPayrollToView] = useState<PayrollInfo | null>(null)
  const [editForm, setEditForm] = useState({
    bankAccount: "",
    bankIfsc: "",
    bankName: "",
    taxRegime: "old",
    basicSalary: "",
    hra: "",
    otherAllowances: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    let filtered = payrollData

    if (searchTerm) {
      filtered = filtered.filter(payroll =>
        payroll.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.user.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(payroll => payroll.user.department?.name === departmentFilter)
    }

    setFilteredPayroll(filtered)
  }, [payrollData, searchTerm, departmentFilter])

  const handleEditPayroll = async () => {
    if (!editingPayroll) return

    try {
      const payload = {
        bankAccount: editForm.bankAccount || undefined,
        bankIfsc: editForm.bankIfsc || undefined,
        bankName: editForm.bankName || undefined,
        taxRegime: editForm.taxRegime,
        basicSalary: parseFloat(editForm.basicSalary),
        hra: editForm.hra ? parseFloat(editForm.hra) : undefined,
        otherAllowances: editForm.otherAllowances ? parseFloat(editForm.otherAllowances) : undefined
      }

      const response = await fetch(`/api/payroll/${editingPayroll.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const updatedPayroll = await response.json()
        onPayrollUpdated(updatedPayroll)
        setEditingPayroll(null)
        toast({
          title: "Success",
          description: "Payroll information updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update payroll information",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating payroll:', error)
      toast({
        title: "Error",
        description: "Failed to update payroll information",
        variant: "destructive"
      })
    }
  }

  const handleDeletePayroll = async () => {
    if (!payrollToDelete) return

    try {
      const response = await fetch(`/api/payroll/${payrollToDelete.userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onPayrollDeleted(payrollToDelete.userId)
        setDeleteDialogOpen(false)
        setPayrollToDelete(null)
        toast({
          title: "Success",
          description: "Payroll information deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete payroll information",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting payroll:', error)
      toast({
        title: "Error",
        description: "Failed to delete payroll information",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (payroll: PayrollInfo) => {
    setEditingPayroll(payroll)
    setEditForm({
      bankAccount: payroll.bankAccount || "",
      bankIfsc: payroll.bankIfsc || "",
      bankName: payroll.bankName || "",
      taxRegime: payroll.taxRegime || "old",
      basicSalary: payroll.basicSalary?.toString() || "",
      hra: payroll.hra?.toString() || "",
      otherAllowances: payroll.otherAllowances?.toString() || ""
    })
  }

  const openDeleteDialog = (payroll: PayrollInfo) => {
    setPayrollToDelete(payroll)
    setDeleteDialogOpen(true)
  }

  const openViewDialog = (payroll: PayrollInfo) => {
    setPayrollToView(payroll)
    setViewDialogOpen(true)
  }

  const uniqueDepartments = Array.from(new Set(payrollData.map(p => p.user.department?.name).filter(Boolean)))

  if (filteredPayroll.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No payroll records found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Tax Regime</TableHead>
              <TableHead>Bank Account</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayroll.map((payroll) => (
              <TableRow key={payroll.userId}>
                <TableCell>
                  <div>
                    <div className="font-medium">{payroll.user.name}</div>
                    <div className="text-sm text-muted-foreground">{payroll.user.employeeId}</div>
                  </div>
                </TableCell>
                <TableCell>{payroll.user.department?.name || 'N/A'}</TableCell>
                <TableCell>
                  {payroll.basicSalary ? `₹${payroll.basicSalary.toLocaleString()}` : 'N/A'}
                </TableCell>
                <TableCell>
                  {payroll.salaryBreakdown?.netSalary ? (
                    <span className="text-green-600 font-medium">
                      ₹{payroll.salaryBreakdown.netSalary.toLocaleString()}
                    </span>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {payroll.taxRegime?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{payroll.bankName || 'N/A'}</div>
                    <div className="text-muted-foreground">
                      {payroll.bankAccount ? `****${payroll.bankAccount.slice(-4)}` : 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewDialog(payroll)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => openEditDialog(payroll)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(payroll)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              Detailed payroll information for {payrollToView?.user.name}
            </DialogDescription>
          </DialogHeader>
          {payrollToView && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Employee Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {payrollToView.user.name}</div>
                    <div><span className="font-medium">Employee ID:</span> {payrollToView.user.employeeId}</div>
                    <div><span className="font-medium">Department:</span> {payrollToView.user.department?.name}</div>
                    <div><span className="font-medium">Designation:</span> {payrollToView.user.designation?.name}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Bank Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Bank:</span> {payrollToView.bankName}</div>
                    <div><span className="font-medium">Account:</span> {payrollToView.bankAccount}</div>
                    <div><span className="font-medium">IFSC:</span> {payrollToView.bankIfsc}</div>
                    <div><span className="font-medium">Tax Regime:</span> {payrollToView.taxRegime?.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              {payrollToView.salaryBreakdown && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Salary Breakdown</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        <span>₹{payrollToView.salaryBreakdown.basic.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRA</span>
                        <span>₹{payrollToView.salaryBreakdown.hra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Allowances</span>
                        <span>₹{payrollToView.salaryBreakdown.allowances.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Gross Salary</span>
                        <span>₹{payrollToView.salaryBreakdown.grossSalary.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tax Deducted</span>
                        <span>₹{payrollToView.salaryBreakdown.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Net Salary</span>
                        <span className="text-green-600">₹{payrollToView.salaryBreakdown.netSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPayroll} onOpenChange={() => setEditingPayroll(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Payroll Information</DialogTitle>
            <DialogDescription>
              Update payroll information for {editingPayroll?.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bankAccount">Bank Account Number</Label>
                <Input
                  id="edit-bankAccount"
                  value={editForm.bankAccount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bankIfsc">Bank IFSC Code</Label>
                <Input
                  id="edit-bankIfsc"
                  value={editForm.bankIfsc}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bankIfsc: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bankName">Bank Name</Label>
                <Input
                  id="edit-bankName"
                  value={editForm.bankName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-taxRegime">Tax Regime</Label>
                <Select value={editForm.taxRegime} onValueChange={(value) => setEditForm(prev => ({ ...prev, taxRegime: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old">Old Regime</SelectItem>
                    <SelectItem value="new">New Regime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-basicSalary">Basic Salary (₹)</Label>
                <Input
                  id="edit-basicSalary"
                  type="number"
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, basicSalary: e.target.value }))}
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hra">HRA (₹)</Label>
                <Input
                  id="edit-hra"
                  type="number"
                  value={editForm.hra}
                  onChange={(e) => setEditForm(prev => ({ ...prev, hra: e.target.value }))}
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-otherAllowances">Other Allowances (₹)</Label>
                <Input
                  id="edit-otherAllowances"
                  type="number"
                  value={editForm.otherAllowances}
                  onChange={(e) => setEditForm(prev => ({ ...prev, otherAllowances: e.target.value }))}
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayroll(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditPayroll}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payroll Information</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete payroll information for "{payrollToDelete?.user.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePayroll}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}