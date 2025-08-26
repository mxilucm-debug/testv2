"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, DollarSign } from "lucide-react"

interface PayrollFormProps {
  onPayrollCreated: (payroll: any) => void
}

export function PayrollForm({ onPayrollCreated }: PayrollFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userId: "",
    bankAccount: "",
    bankIfsc: "",
    bankName: "",
    taxRegime: "old",
    basicSalary: "",
    hra: "",
    otherAllowances: ""
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId || !formData.basicSalary) {
      toast({
        title: "Error",
        description: "User ID and Basic Salary are required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const payload = {
        userId: formData.userId,
        bankAccount: formData.bankAccount || undefined,
        bankIfsc: formData.bankIfsc || undefined,
        bankName: formData.bankName || undefined,
        taxRegime: formData.taxRegime,
        basicSalary: parseFloat(formData.basicSalary),
        hra: formData.hra ? parseFloat(formData.hra) : undefined,
        otherAllowances: formData.otherAllowances ? parseFloat(formData.otherAllowances) : undefined
      }

      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const newPayroll = await response.json()
        onPayrollCreated(newPayroll)
        setOpen(false)
        // Reset form
        setFormData({
          userId: "",
          bankAccount: "",
          bankIfsc: "",
          bankName: "",
          taxRegime: "old",
          basicSalary: "",
          hra: "",
          otherAllowances: ""
        })
        toast({
          title: "Success",
          description: "Payroll information created successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create payroll information",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating payroll:', error)
      toast({
        title: "Error",
        description: "Failed to create payroll information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Payroll Information</DialogTitle>
          <DialogDescription>
            Create payroll information for an employee
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID *</Label>
                <Input
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  placeholder="Enter user ID"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder="Enter bank account number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankIfsc">Bank IFSC Code</Label>
                <Input
                  id="bankIfsc"
                  value={formData.bankIfsc}
                  onChange={(e) => handleInputChange('bankIfsc', e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRegime">Tax Regime</Label>
                <Select value={formData.taxRegime} onValueChange={(value) => handleInputChange('taxRegime', value)}>
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
                <Label htmlFor="basicSalary">Basic Salary (₹) *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                  placeholder="Enter basic salary"
                  min="0"
                  step="100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hra">HRA (₹)</Label>
                <Input
                  id="hra"
                  type="number"
                  value={formData.hra}
                  onChange={(e) => handleInputChange('hra', e.target.value)}
                  placeholder="Enter HRA amount"
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherAllowances">Other Allowances (₹)</Label>
                <Input
                  id="otherAllowances"
                  type="number"
                  value={formData.otherAllowances}
                  onChange={(e) => handleInputChange('otherAllowances', e.target.value)}
                  placeholder="Enter other allowances"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>
          
          {/* Salary Preview */}
          {formData.basicSalary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Salary Preview</CardTitle>
                <CardDescription className="text-xs">
                  Estimated salary breakdown (preview only)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>₹{parseFloat(formData.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA:</span>
                    <span>₹{parseFloat(formData.hra || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Allowances:</span>
                    <span>₹{parseFloat(formData.otherAllowances || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Gross Salary:</span>
                    <span>₹{(parseFloat(formData.basicSalary || 0) + parseFloat(formData.hra || 0) + parseFloat(formData.otherAllowances || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Payroll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}