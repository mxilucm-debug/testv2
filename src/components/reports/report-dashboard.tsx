"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileBarChart, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  CheckSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Eye,
  Filter,
  Search,
  RefreshCw
} from "lucide-react"

interface ReportData {
  id: string
  title: string
  type: string
  category: string
  description: string
  lastGenerated: string
  status: "completed" | "pending" | "generating"
  size: string
  format: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "employee-summary",
    name: "Employee Summary Report",
    description: "Comprehensive overview of all employees with key metrics",
    category: "HR",
    icon: Users,
    color: "bg-blue-500"
  },
  {
    id: "attendance-analysis",
    name: "Attendance Analysis",
    description: "Detailed attendance patterns and trends analysis",
    category: "Attendance",
    icon: Clock,
    color: "bg-green-500"
  },
  {
    id: "leave-summary",
    name: "Leave Summary",
    description: "Leave utilization and balance across departments",
    category: "Leave",
    icon: Calendar,
    color: "bg-purple-500"
  },
  {
    id: "payroll-summary",
    name: "Payroll Summary",
    description: "Monthly payroll breakdown and expense analysis",
    category: "Payroll",
    icon: DollarSign,
    color: "bg-yellow-500"
  },
  {
    id: "task-performance",
    name: "Task Performance Report",
    description: "Task completion rates and team productivity metrics",
    category: "Tasks",
    icon: CheckSquare,
    color: "bg-red-500"
  },
  {
    id: "department-performance",
    name: "Department Performance",
    description: "Performance metrics by department and team",
    category: "Analytics",
    icon: BarChart3,
    color: "bg-indigo-500"
  }
]

const mockReportData: ReportData[] = [
  {
    id: "1",
    title: "Monthly Employee Summary - March 2025",
    type: "Employee Summary",
    category: "HR",
    description: "Complete employee headcount, department distribution, and demographic analysis",
    lastGenerated: "2025-06-18",
    status: "completed",
    size: "2.4 MB",
    format: "PDF"
  },
  {
    id: "2",
    title: "Q1 2025 Attendance Analysis",
    type: "Attendance Analysis",
    category: "Attendance",
    description: "Quarterly attendance trends, late arrivals, and overtime analysis",
    lastGenerated: "2025-06-15",
    status: "completed",
    size: "1.8 MB",
    format: "Excel"
  },
  {
    id: "3",
    title: "Leave Balance Report - June 2025",
    type: "Leave Summary",
    category: "Leave",
    description: "Current leave balances and utilization rates across all leave types",
    lastGenerated: "2025-06-20",
    status: "generating",
    size: "856 KB",
    format: "PDF"
  },
  {
    id: "4",
    title: "Payroll Summary - May 2025",
    type: "Payroll Summary",
    category: "Payroll",
    description: "Monthly payroll expenses, deductions, and department-wise breakdown",
    lastGenerated: "2025-06-10",
    status: "completed",
    size: "3.2 MB",
    format: "Excel"
  },
  {
    id: "5",
    title: "Task Performance Dashboard - Q2 2025",
    type: "Task Performance",
    category: "Tasks",
    description: "Task completion rates, team productivity, and performance metrics",
    lastGenerated: "2025-06-18",
    status: "pending",
    size: "1.5 MB",
    format: "PowerPoint"
  }
]

const reportStats = {
  totalReports: 156,
  completedThisMonth: 24,
  pendingGeneration: 3,
  storageUsed: "2.8 GB",
  popularCategory: "HR Reports"
}

export function ReportDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [reports, setReports] = useState<ReportData[]>(mockReportData)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === "all" || report.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["all", ...new Set(reports.map(r => r.category))]

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(templateId)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(null)
      // Add new report to the list
      const template = reportTemplates.find(t => t.id === templateId)
      if (template) {
        const newReport: ReportData = {
          id: Date.now().toString(),
          title: `${template.name} - ${new Date().toLocaleDateString()}`,
          type: template.name,
          category: template.category,
          description: template.description,
          lastGenerated: new Date().toISOString().split('T')[0],
          status: "completed",
          size: "1.2 MB",
          format: "PDF"
        }
        setReports(prev => [newReport, ...prev])
      }
    }, 3000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "generating":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Generating</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate, view, and manage comprehensive reports for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Reports generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.pendingGeneration}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting generation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              Of 10 GB available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Category</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.popularCategory}</div>
            <p className="text-xs text-muted-foreground">
              Most generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Choose from pre-built report templates to generate comprehensive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reportTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs mb-3">
                          {template.description}
                        </CardDescription>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleGenerateReport(template.id)}
                          disabled={isGenerating === template.id}
                        >
                          {isGenerating === template.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileBarChart className="h-4 w-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
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
                <select
                  className="border rounded-md px-3 py-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{report.title}</h3>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Category: {report.category}</span>
                              <span>Format: {report.format}</span>
                              <span>Size: {report.size}</span>
                              <span>Generated: {report.lastGenerated}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
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

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Manage automated report generation schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Set up automated report generation to receive regular insights
                </p>
                <Button>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}