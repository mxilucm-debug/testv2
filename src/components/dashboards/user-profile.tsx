"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Building2, FileText, GraduationCap, LogOut, Edit, Save, X, Loader2 } from "lucide-react"

interface UserData {
  personal: {
    name: string
    employeeId: string
    email: string
    dateOfBirth: string | null
    gender: string | null
    maritalStatus: string | null
    nationality: string | null
    contactNumber: string | null
    emergencyContactName: string | null
    emergencyContactRelationship: string | null
    emergencyContactNumber: string | null
    currentAddress: string | null
    permanentAddress: string | null
  }
  employment: {
    dateOfJoining: string | null
    employmentType: string | null
    department: string | null
    designation: string | null
    reportingManager: string | null
    workLocation: string | null
    employmentStatus: string | null
    confirmationDate: string | null
  }
  statutory: {
    pan: string | null
    aadhaar: string | null
    uan: string | null
    epfNumber: string | null
    esiNumber: string | null
  } | null
  payroll: {
    bankAccount: string | null
    bankIfsc: string | null
    bankName: string | null
    taxRegime: string | null
  } | null
  education: Array<{
    id: string
    degree: string | null
    institution: string | null
    university: string | null
    yearOfPassing: number | null
    percentage: number | null
  }>
  previousEmployment: Array<{
    id: string
    companyName: string | null
    position: string | null
    duration: string | null
    startDate: string | null
    endDate: string | null
    reasonForLeaving: string | null
  }>
  exit: {
    dateOfResignation: string | null
    lastWorkingDay: string | null
  }
  documents: Array<{
    id: string
    name: string
    type: string
    fileUrl: string
    createdAt: string
  }>
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section: string, field: string, value: string) => {
    if (!userData) return
    
    setUserData(prev => ({
      ...prev!,
      [section]: {
        ...prev![section as keyof typeof prev] as any,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!userData) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal: userData.personal,
          employment: userData.employment,
          statutory: userData.statutory,
          payroll: userData.payroll
        })
      })

      if (response.ok) {
        setIsEditing(false)
        await fetchUserProfile()
      } else {
        console.error('Error saving profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error loading profile</h2>
          <Button onClick={fetchUserProfile}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal and professional information</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="statutory" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statutory
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="exit" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Exit
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={userData.personal.name || ""}
                      onChange={(e) => handleInputChange("personal", "name", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  {isEditing ? (
                    <Input
                      id="employeeId"
                      value={userData.personal.employeeId || ""}
                      onChange={(e) => handleInputChange("personal", "employeeId", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.employeeId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={userData.personal.email || ""}
                      onChange={(e) => handleInputChange("personal", "email", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={userData.personal.dateOfBirth || ""}
                      onChange={(e) => handleInputChange("personal", "dateOfBirth", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.dateOfBirth}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select value={userData.personal.gender || ""} onValueChange={(value) => handleInputChange("personal", "gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.gender}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  {isEditing ? (
                    <Select value={userData.personal.maritalStatus || ""} onValueChange={(value) => handleInputChange("personal", "maritalStatus", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.maritalStatus}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  {isEditing ? (
                    <Input
                      id="nationality"
                      value={userData.personal.nationality || ""}
                      onChange={(e) => handleInputChange("personal", "nationality", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.nationality}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  {isEditing ? (
                    <Input
                      id="contactNumber"
                      value={userData.personal.contactNumber || ""}
                      onChange={(e) => handleInputChange("personal", "contactNumber", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.contactNumber}</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Name</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContactName"
                      value={userData.personal.emergencyContactName || ""}
                      onChange={(e) => handleInputChange("personal", "emergencyContactName", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.emergencyContactName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContactRelationship"
                      value={userData.personal.emergencyContactRelationship || ""}
                      onChange={(e) => handleInputChange("personal", "emergencyContactRelationship", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.emergencyContactRelationship}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactNumber">Contact Number</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContactNumber"
                      value={userData.personal.emergencyContactNumber || ""}
                      onChange={(e) => handleInputChange("personal", "emergencyContactNumber", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.emergencyContactNumber}</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <h3 className="text-lg font-semibold">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentAddress">Current Address</Label>
                  {isEditing ? (
                    <Textarea
                      id="currentAddress"
                      value={userData.personal.currentAddress || ""}
                      onChange={(e) => handleInputChange("personal", "currentAddress", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.currentAddress}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanentAddress">Permanent Address</Label>
                  {isEditing ? (
                    <Textarea
                      id="permanentAddress"
                      value={userData.personal.permanentAddress || ""}
                      onChange={(e) => handleInputChange("personal", "permanentAddress", e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.personal.permanentAddress}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Details Tab */}
        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Current employment information and job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={userData.employment.dateOfJoining || ""}
                      onChange={(e) => handleInputChange("employment", "dateOfJoining", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.dateOfJoining}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  {isEditing ? (
                    <Select value={userData.employment.employmentType || ""} onValueChange={(value) => handleInputChange("employment", "employmentType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERMANENT">Permanent</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        <SelectItem value="PROBATION">Probation</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.employmentType}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={userData.employment.department || ""}
                      onChange={(e) => handleInputChange("employment", "department", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.department}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  {isEditing ? (
                    <Input
                      id="designation"
                      value={userData.employment.designation || ""}
                      onChange={(e) => handleInputChange("employment", "designation", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.designation}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportingManager">Reporting Manager</Label>
                  {isEditing ? (
                    <Input
                      id="reportingManager"
                      value={userData.employment.reportingManager || ""}
                      onChange={(e) => handleInputChange("employment", "reportingManager", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.reportingManager}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location</Label>
                  {isEditing ? (
                    <Input
                      id="workLocation"
                      value={userData.employment.workLocation || ""}
                      onChange={(e) => handleInputChange("employment", "workLocation", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.workLocation}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  {isEditing ? (
                    <Select value={userData.employment.employmentStatus || ""} onValueChange={(value) => handleInputChange("employment", "employmentStatus", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.employmentStatus}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmationDate">Confirmation Date</Label>
                  {isEditing ? (
                    <Input
                      id="confirmationDate"
                      type="date"
                      value={userData.employment.confirmationDate || ""}
                      onChange={(e) => handleInputChange("employment", "confirmationDate", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.employment.confirmationDate}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statutory & Payroll Tab */}
        <TabsContent value="statutory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statutory & Compliance</CardTitle>
                <CardDescription>India-specific statutory information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    {isEditing ? (
                      <Input
                        id="pan"
                        value={userData.statutory?.pan || ""}
                        onChange={(e) => handleInputChange("statutory", "pan", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.statutory?.pan}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar">Aadhaar</Label>
                    {isEditing ? (
                      <Input
                        id="aadhaar"
                        value={userData.statutory?.aadhaar || ""}
                        onChange={(e) => handleInputChange("statutory", "aadhaar", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.statutory?.aadhaar}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uan">UAN</Label>
                    {isEditing ? (
                      <Input
                        id="uan"
                        value={userData.statutory?.uan || ""}
                        onChange={(e) => handleInputChange("statutory", "uan", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.statutory?.uan}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="epfNumber">EPF Number</Label>
                    {isEditing ? (
                      <Input
                        id="epfNumber"
                        value={userData.statutory?.epfNumber || ""}
                        onChange={(e) => handleInputChange("statutory", "epfNumber", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.statutory?.epfNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esiNumber">ESI Number</Label>
                    {isEditing ? (
                      <Input
                        id="esiNumber"
                        value={userData.statutory?.esiNumber || ""}
                        onChange={(e) => handleInputChange("statutory", "esiNumber", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.statutory?.esiNumber}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll & Compensation</CardTitle>
                <CardDescription>Bank account and salary information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    {isEditing ? (
                      <Input
                        id="bankAccount"
                        value={userData.payroll?.bankAccount || ""}
                        onChange={(e) => handleInputChange("payroll", "bankAccount", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.payroll?.bankAccount}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankIfsc">Bank IFSC Code</Label>
                    {isEditing ? (
                      <Input
                        id="bankIfsc"
                        value={userData.payroll?.bankIfsc || ""}
                        onChange={(e) => handleInputChange("payroll", "bankIfsc", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.payroll?.bankIfsc}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    {isEditing ? (
                      <Input
                        id="bankName"
                        value={userData.payroll?.bankName || ""}
                        onChange={(e) => handleInputChange("payroll", "bankName", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{userData.payroll?.bankName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRegime">Tax Regime</Label>
                    {isEditing ? (
                      <Select value={userData.payroll?.taxRegime || ""} onValueChange={(value) => handleInputChange("payroll", "taxRegime", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select regime" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="old">Old Regime</SelectItem>
                          <SelectItem value="new">New Regime</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">{userData.payroll?.taxRegime}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Education & Professional Background Tab */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Educational Qualifications</CardTitle>
              <CardDescription>Academic background and qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.education.map((edu, index) => (
                <div key={edu.id} className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      {isEditing ? (
                        <Input
                          value={edu.degree || ""}
                          onChange={(e) => {
                            const newEducation = [...userData.education]
                            newEducation[index].degree = e.target.value
                            setUserData(prev => prev ? { ...prev, education: newEducation } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{edu.degree}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      {isEditing ? (
                        <Input
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const newEducation = [...userData.education]
                            newEducation[index].institution = e.target.value
                            setUserData(prev => prev ? { ...prev, education: newEducation } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{edu.institution}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>University</Label>
                      {isEditing ? (
                        <Input
                          value={edu.university || ""}
                          onChange={(e) => {
                            const newEducation = [...userData.education]
                            newEducation[index].university = e.target.value
                            setUserData(prev => prev ? { ...prev, education: newEducation } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{edu.university}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Year of Passing</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={edu.yearOfPassing || ""}
                          onChange={(e) => {
                            const newEducation = [...userData.education]
                            newEducation[index].yearOfPassing = parseInt(e.target.value) || null
                            setUserData(prev => prev ? { ...prev, education: newEducation } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{edu.yearOfPassing}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Percentage</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={edu.percentage || ""}
                          onChange={(e) => {
                            const newEducation = [...userData.education]
                            newEducation[index].percentage = parseFloat(e.target.value) || null
                            setUserData(prev => prev ? { ...prev, education: newEducation } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{edu.percentage}%</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isEditing && (
                <Button variant="outline" className="w-full">
                  Add Education
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous Employment</CardTitle>
              <CardDescription>Work experience before joining this organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.previousEmployment.map((emp, index) => (
                <div key={emp.id} className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      {isEditing ? (
                        <Input
                          value={emp.companyName || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].companyName = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.companyName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      {isEditing ? (
                        <Input
                          value={emp.position || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].position = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.position}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      {isEditing ? (
                        <Input
                          value={emp.duration || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].duration = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.duration}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={emp.startDate || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].startDate = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.startDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={emp.endDate || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].endDate = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.endDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Leaving</Label>
                      {isEditing ? (
                        <Input
                          value={emp.reasonForLeaving || ""}
                          onChange={(e) => {
                            const newEmployment = [...userData.previousEmployment]
                            newEmployment[index].reasonForLeaving = e.target.value
                            setUserData(prev => prev ? { ...prev, previousEmployment: newEmployment } : null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{emp.reasonForLeaving}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isEditing && (
                <Button variant="outline" className="w-full">
                  Add Employment
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Information Tab */}
        <TabsContent value="exit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Information</CardTitle>
              <CardDescription>Resignation and separation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfResignation">Date of Resignation</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfResignation"
                      type="date"
                      value={userData.exit.dateOfResignation || ""}
                      onChange={(e) => handleInputChange("exit", "dateOfResignation", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.exit.dateOfResignation || "Not resigned"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastWorkingDay">Last Working Day</Label>
                  {isEditing ? (
                    <Input
                      id="lastWorkingDay"
                      type="date"
                      value={userData.exit.lastWorkingDay || ""}
                      onChange={(e) => handleInputChange("exit", "lastWorkingDay", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{userData.exit.lastWorkingDay || "Not specified"}</p>
                  )}
                </div>
              </div>
              {!userData.exit.dateOfResignation && (
                <div className="text-center py-8 text-muted-foreground">
                  <LogOut className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exit information available. Employee is currently active.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}