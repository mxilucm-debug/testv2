"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  Search, 
  Filter, 
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Camera,
  Eye,
  ExternalLink
} from "lucide-react"

interface AttendanceRecord {
  id: string
  userId: string
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
  punchInTime?: string
  punchOutTime?: string
  punchInLocation?: string
  punchOutLocation?: string
  punchInSelfie?: string
  punchOutSelfie?: string
  shift?: {
    id: string
    name: string
    startTime: string
    endTime: string
  }
  status: string
  totalHours?: number
  remarks?: string
  createdAt: string
  updatedAt: string
}

interface AttendanceStats {
  totalRecords: number
  present: number
  absent: number
  late: number
  halfDay: number
  averageHours: number
}

export function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    averageHours: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    status: ''
  })
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  const parseLocation = (locationString?: string): { latitude: number; longitude: number; accuracy?: number } | null => {
    if (!locationString) return null
    
    try {
      const location = JSON.parse(locationString)
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }
    } catch {
      return null
    }
  }

  const openGoogleMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  const fetchAttendanceRecords = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value)
      })

      const response = await fetch(`/api/attendance?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAttendanceRecords(result.data)
        
        // Calculate stats
        const totalRecords = result.data.length
        const present = result.data.filter((record: AttendanceRecord) => record.status === 'present').length
        const absent = result.data.filter((record: AttendanceRecord) => record.status === 'absent').length
        const late = result.data.filter((record: AttendanceRecord) => record.status === 'late').length
        const halfDay = result.data.filter((record: AttendanceRecord) => record.status === 'half_day').length
        
        const totalHours = result.data.reduce((sum: number, record: AttendanceRecord) => 
          sum + (record.totalHours || 0), 0
        )
        const averageHours = totalRecords > 0 ? totalHours / totalRecords : 0

        setStats({
          totalRecords,
          present,
          absent,
          late,
          halfDay,
          averageHours: Math.round(averageHours * 100) / 100
        })
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceRecords()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchAttendanceRecords()
  }

  const clearFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      status: 'all'
    })
    setTimeout(fetchAttendanceRecords, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'half_day':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />
      case 'absent':
        return <XCircle className="h-4 w-4" />
      case 'late':
        return <AlertTriangle className="h-4 w-4" />
      case 'half_day':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return '-'
    return new Date(dateTimeString).toLocaleString()
  }

  const formatTime = (dateTimeString?: string) => {
    if (!dateTimeString) return '-'
    return new Date(dateTimeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage employee attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.present / stats.totalRecords) * 100)}% rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.late / stats.totalRecords) * 100)}% rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.absent / stats.totalRecords) * 100)}% rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageHours}h</div>
              <p className="text-xs text-muted-foreground">
                per day
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Input
                placeholder="Search by name or email"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Detailed attendance records for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Punch Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{record.user.name}</p>
                          <p className="text-sm text-muted-foreground">{record.user.email}</p>
                          {record.user.employeeId && (
                            <p className="text-xs text-muted-foreground">ID: {record.user.employeeId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.user.department?.name || '-'}
                      {record.user.designation && (
                        <p className="text-sm text-muted-foreground">{record.user.designation.name}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(record.punchInTime)}
                      </div>
                      {record.punchInLocation && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => {
                              const location = parseLocation(record.punchInLocation)
                              if (location) {
                                openGoogleMaps(location.latitude, location.longitude)
                              }
                            }}
                          >
                            View Location
                          </Button>
                        </div>
                      )}
                      {record.punchInSelfie && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Camera className="h-3 w-3" />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs"
                              >
                                View Selfie
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Punch In Selfie</DialogTitle>
                              </DialogHeader>
                              <div className="flex items-center justify-center">
                                <img 
                                  src={record.punchInSelfie} 
                                  alt="Punch in selfie" 
                                  className="max-w-full max-h-96 rounded-lg object-cover"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(record.punchOutTime)}
                      </div>
                      {record.punchOutLocation && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => {
                              const location = parseLocation(record.punchOutLocation)
                              if (location) {
                                openGoogleMaps(location.latitude, location.longitude)
                              }
                            }}
                          >
                            View Location
                          </Button>
                        </div>
                      )}
                      {record.punchOutSelfie && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Camera className="h-3 w-3" />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs"
                              >
                                View Selfie
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Punch Out Selfie</DialogTitle>
                              </DialogHeader>
                              <div className="flex items-center justify-center">
                                <img 
                                  src={record.punchOutSelfie} 
                                  alt="Punch out selfie" 
                                  className="max-w-full max-h-96 rounded-lg object-cover"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.totalHours ? `${record.totalHours}h` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {record.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.shift?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Attendance Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Employee Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Employee Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Name:</span> {record.user.name}</p>
                                    <p><span className="font-medium">Email:</span> {record.user.email}</p>
                                    {record.user.employeeId && (
                                      <p><span className="font-medium">Employee ID:</span> {record.user.employeeId}</p>
                                    )}
                                    <p><span className="font-medium">Department:</span> {record.user.department?.name || '-'}</p>
                                    {record.user.designation && (
                                      <p><span className="font-medium">Designation:</span> {record.user.designation.name}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Attendance Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Date:</span> {new Date(record.createdAt).toLocaleDateString()}</p>
                                    <p><span className="font-medium">Punch In:</span> {formatDateTime(record.punchInTime)}</p>
                                    <p><span className="font-medium">Punch Out:</span> {formatDateTime(record.punchOutTime)}</p>
                                    <p><span className="font-medium">Total Hours:</span> {record.totalHours ? `${record.totalHours}h` : '-'}</p>
                                    <p><span className="font-medium">Status:</span> 
                                      <Badge className={`ml-2 ${getStatusColor(record.status)}`}>
                                        {record.status.replace('_', ' ')}
                                      </Badge>
                                    </p>
                                    {record.shift && (
                                      <p><span className="font-medium">Shift:</span> {record.shift.name} ({record.shift.startTime} - {record.shift.endTime})</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Location Information */}
                              {(record.punchInLocation || record.punchOutLocation) && (
                                <div>
                                  <h4 className="font-medium mb-2">Location Information</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {record.punchInLocation && (
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Punch In Location</p>
                                        {parseLocation(record.punchInLocation) && (
                                          <div className="text-sm space-y-1">
                                            <p>Lat: {parseLocation(record.punchInLocation)?.latitude?.toFixed(6)}</p>
                                            <p>Lng: {parseLocation(record.punchInLocation)?.longitude?.toFixed(6)}</p>
                                            {parseLocation(record.punchInLocation)?.accuracy && (
                                              <p>Accuracy: ±{parseLocation(record.punchInLocation)?.accuracy?.toFixed(0)}m</p>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const location = parseLocation(record.punchInLocation)
                                                if (location) {
                                                  openGoogleMaps(location.latitude, location.longitude)
                                                }
                                              }}
                                              className="flex items-center gap-1"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              View on Maps
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {record.punchOutLocation && (
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Punch Out Location</p>
                                        {parseLocation(record.punchOutLocation) && (
                                          <div className="text-sm space-y-1">
                                            <p>Lat: {parseLocation(record.punchOutLocation)?.latitude?.toFixed(6)}</p>
                                            <p>Lng: {parseLocation(record.punchOutLocation)?.longitude?.toFixed(6)}</p>
                                            {parseLocation(record.punchOutLocation)?.accuracy && (
                                              <p>Accuracy: ±{parseLocation(record.punchOutLocation)?.accuracy?.toFixed(0)}m</p>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const location = parseLocation(record.punchOutLocation)
                                                if (location) {
                                                  openGoogleMaps(location.latitude, location.longitude)
                                                }
                                              }}
                                              className="flex items-center gap-1"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              View on Maps
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Selfie Information */}
                              {(record.punchInSelfie || record.punchOutSelfie) && (
                                <div>
                                  <h4 className="font-medium mb-2">Selfie Verification</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {record.punchInSelfie && (
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Punch In Selfie</p>
                                        <img 
                                          src={record.punchInSelfie} 
                                          alt="Punch in selfie" 
                                          className="w-full max-h-48 rounded-lg object-cover"
                                        />
                                      </div>
                                    )}
                                    {record.punchOutSelfie && (
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Punch Out Selfie</p>
                                        <img 
                                          src={record.punchOutSelfie} 
                                          alt="Punch out selfie" 
                                          className="w-full max-h-48 rounded-lg object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Remarks */}
                              {record.remarks && (
                                <div>
                                  <h4 className="font-medium mb-2">Remarks</h4>
                                  <p className="text-sm text-muted-foreground">{record.remarks}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}