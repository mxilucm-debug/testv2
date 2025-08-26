"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Download, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  DollarSign, 
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  FilePdf,
  FileArchive,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Share2
} from "lucide-react"
import { format } from "date-fns"

interface ReportDownloadConfig {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  formats: string[]
  availableFilters: string[]
  roleAccess: string[]
}

interface DownloadHistory {
  id: string
  reportName: string
  type: string
  format: string
  size: string
  status: "completed" | "failed" | "processing"
  downloadUrl?: string
  generatedAt: string
  generatedBy: string
  filters: Record<string, any>
}

const reportConfigs: ReportDownloadConfig[] = [
  {
    id: "leave-reports",
    name: "Leave Reports",
    description: "Comprehensive leave data including balances, requests, and utilization",
    category: "HR",
    icon: CalendarIcon,
    color: "bg-purple-500",
    formats: ["PDF", "Excel", "CSV"],
    availableFilters: ["dateRange", "department", "leaveType", "employee", "status"],
    roleAccess: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    id: "attendance-reports",
    name: "Attendance Reports",
    description: "Detailed attendance records, overtime, and absence analysis",
    category: "Attendance",
    icon: Clock,
    color: "bg-green-500",
    formats: ["PDF", "Excel", "CSV"],
    availableFilters: ["dateRange", "department", "employee", "shift", "status"],
    roleAccess: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    id: "payroll-reports",
    name: "Payroll Reports",
    description: "Complete payroll data including salaries, deductions, and benefits",
    category: "Payroll",
    icon: DollarSign,
    color: "bg-yellow-500",
    formats: ["PDF", "Excel", "CSV"],
    availableFilters: ["dateRange", "department", "employee", "payType", "status"],
    roleAccess: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    id: "employee-reports",
    name: "Employee Reports",
    description: "Employee directory, demographics, and employment details",
    category: "HR",
    icon: Users,
    color: "bg-blue-500",
    formats: ["PDF", "Excel", "CSV"],
    availableFilters: ["department", "designation", "employmentType", "status", "dateRange"],
    roleAccess: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    id: "error-logs",
    name: "Error Logs",
    description: "System error logs and debugging information",
    category: "System",
    icon: AlertTriangle,
    color: "bg-red-500",
    formats: ["TXT", "CSV", "JSON"],
    availableFilters: ["dateRange", "errorType", "severity", "module", "status"],
    roleAccess: ["SUPER_ADMIN"]
  }
]

const mockDownloadHistory: DownloadHistory[] = [
  {
    id: "1",
    reportName: "Monthly Leave Summary",
    type: "leave-reports",
    format: "PDF",
    size: "2.4 MB",
    status: "completed",
    downloadUrl: "/api/reports/download/1",
    generatedAt: "2025-06-20T10:30:00Z",
    generatedBy: "John Manager",
    filters: { dateRange: { start: "2025-06-01", end: "2025-06-30" }, department: "all" }
  },
  {
    id: "2",
    reportName: "Q2 Attendance Analysis",
    type: "attendance-reports",
    format: "Excel",
    size: "3.8 MB",
    status: "completed",
    downloadUrl: "/api/reports/download/2",
    generatedAt: "2025-06-19T14:15:00Z",
    generatedBy: "Sarah Admin",
    filters: { dateRange: { start: "2025-04-01", end: "2025-06-30" }, department: "engineering" }
  },
  {
    id: "3",
    reportName: "Payroll Summary - May 2025",
    type: "payroll-reports",
    format: "Excel",
    size: "5.2 MB",
    status: "processing",
    generatedAt: "2025-06-20T09:00:00Z",
    generatedBy: "Mike SuperAdmin",
    filters: { dateRange: { start: "2025-05-01", end: "2025-05-31" } }
  },
  {
    id: "4",
    reportName: "Employee Directory",
    type: "employee-reports",
    format: "PDF",
    size: "1.8 MB",
    status: "failed",
    generatedAt: "2025-06-18T16:45:00Z",
    generatedBy: "John Manager",
    filters: { department: "all", status: "active" }
  },
  {
    id: "5",
    reportName: "System Error Logs",
    type: "error-logs",
    format: "TXT",
    size: "856 KB",
    status: "completed",
    downloadUrl: "/api/reports/download/5",
    generatedAt: "2025-06-20T08:30:00Z",
    generatedBy: "Mike SuperAdmin",
    filters: { dateRange: { start: "2025-06-19", end: "2025-06-20" }, severity: "all" }
  }
]

interface ReportFiltersProps {
  config: ReportDownloadConfig
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
}

function ReportFilters({ config, filters, onFiltersChange }: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    to: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined
  })

  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: dateRange.from?.toISOString().split('T')[0],
          end: dateRange.to?.toISOString().split('T')[0]
        }
      })
    }
  }, [dateRange])

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-sm font-medium">Report Filters</h3>
      
      {config.availableFilters.includes("dateRange") && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {config.availableFilters.includes("department") && (
        <div>
          <Label className="text-xs">Department</Label>
          <Select onValueChange={(value) => handleFilterChange("department", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {config.availableFilters.includes("leaveType") && (
        <div>
          <Label className="text-xs">Leave Type</Label>
          <Select onValueChange={(value) => handleFilterChange("leaveType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leave Types</SelectItem>
              <SelectItem value="casual">Casual Leave</SelectItem>
              <SelectItem value="sick">Sick Leave</SelectItem>
              <SelectItem value="annual">Annual Leave</SelectItem>
              <SelectItem value="maternity">Maternity Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {config.availableFilters.includes("status") && (
        <div>
          <Label className="text-xs">Status</Label>
          <Select onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {config.availableFilters.includes("severity") && (
        <div>
          <Label className="text-xs">Severity</Label>
          <Select onValueChange={(value) => handleFilterChange("severity", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

interface ReportDownloadSectionProps {
  userRole: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
}

export function ReportDownloadSection({ userRole }: ReportDownloadSectionProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedFormat, setSelectedFormat] = useState<string>("PDF")
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>(mockDownloadHistory)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const availableReports = reportConfigs.filter(config => 
    config.roleAccess.includes(userRole)
  )

  const filteredHistory = downloadHistory.filter(item =>
    item.reportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConfig = availableReports.find(r => r.id === selectedReport)

  const handleGenerateReport = async () => {
    if (!selectedConfig || !selectedFormat) return

    setIsGenerating(selectedReport)
    
    // Simulate report generation
    setTimeout(() => {
      const newDownload: DownloadHistory = {
        id: Date.now().toString(),
        reportName: `${selectedConfig.name} - ${new Date().toLocaleDateString()}`,
        type: selectedReport,
        format: selectedFormat,
        size: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)} MB`,
        status: "completed",
        downloadUrl: `/api/reports/download/${Date.now()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: userRole === "SUPER_ADMIN" ? "Super Admin" : userRole === "ADMIN" ? "Admin" : "Manager",
        filters: { ...filters }
      }

      setDownloadHistory(prev => [newDownload, ...prev])
      setIsGenerating(null)
      
      // Auto-download the report
      const link = document.createElement('a')
      link.href = newDownload.downloadUrl || '#'
      link.download = `${newDownload.reportName.replace(/\s+/g, '_')}.${selectedFormat.toLowerCase()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 3000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FilePdf className="h-4 w-4" />
      case "excel":
      case "csv":
        return <FileSpreadsheet className="h-4 w-4" />
      case "txt":
      case "json":
        return <FileArchive className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Downloads</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive reports for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              Reports downloaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Currently generating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 GB</div>
            <p className="text-xs text-muted-foreground">
              Of 10 GB available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="history">Download History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Report Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Report Type</CardTitle>
                <CardDescription>
                  Choose the type of report you want to generate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableReports.map((config) => {
                  const Icon = config.icon
                  return (
                    <div
                      key={config.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedReport === config.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedReport(config.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{config.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {config.formats.map(format => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Filters */}
            {selectedConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Filters & Options</CardTitle>
                  <CardDescription>
                    Configure your report parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ReportFilters
                    config={selectedConfig}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                  
                  <div>
                    <Label className="text-xs">Export Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedConfig.formats.map(format => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleGenerateReport}
                    disabled={isGenerating === selectedReport}
                  >
                    {isGenerating === selectedReport ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate & Download
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  Summary of your selected report
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedConfig ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedConfig.color}`}>
                        <selectedConfig.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{selectedConfig.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {selectedConfig.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {selectedConfig.description}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Available Formats:</div>
                      <div className="flex gap-1">
                        {selectedConfig.formats.map(format => (
                          <Badge key={format} variant="secondary" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {Object.keys(filters).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Active Filters:</div>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(filters).map(([key, value]) => (
                            <div key={key}>
                              {key}: {JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a report type to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    className="pl-10 pr-4 py-2 w-full border rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(item.status)}
                              <h3 className="font-medium">{item.reportName}</h3>
                              <Badge variant="outline" className="text-xs">
                                {item.type.replace('-', ' ')}
                              </Badge>
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                {getFormatIcon(item.format)}
                                {item.format}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Size: {item.size} • Generated by {item.generatedBy}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Generated: {new Date(item.generatedAt).toLocaleString()}
                            </div>
                            {Object.keys(item.filters).length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium mb-1">Filters:</div>
                                <div className="text-xs text-muted-foreground">
                                  {Object.entries(item.filters).map(([key, value]) => (
                                    <span key={key} className="mr-2">
                                      {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {item.status === "completed" && item.downloadUrl && (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={item.downloadUrl} download>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </Button>
                              </>
                            )}
                            {item.status === "processing" && (
                              <Button variant="outline" size="sm" disabled>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing
                              </Button>
                            )}
                            {item.status === "failed" && (
                              <Button variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}