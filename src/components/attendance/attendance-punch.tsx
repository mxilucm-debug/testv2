"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Clock, 
  MapPin, 
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
  Bell
} from "lucide-react"
import { useAttendanceSocket } from "@/hooks/use-attendance-socket"

interface AttendanceStatus {
  todayRecord?: {
    id: string
    punchInTime?: string
    punchOutTime?: string
    status: string
    totalHours?: number
  }
  canPunchIn: boolean
  canPunchOut: boolean
}

export function AttendancePunch() {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    canPunchIn: false,
    canPunchOut: false
  })
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Mock user ID and workspace ID - in real app, this would come from authentication
  const userId = "cmepn2wo4000vptfyqbh6cqsj" // employee@techcorp.com
  const workspaceId = "cmepn2vxh0007ptfyxsfwyr2w" // TechCorp

  // WebSocket hook for real-time updates
  const { isConnected, attendanceUpdates, sendAttendanceUpdate, clearUpdates } = useAttendanceSocket(workspaceId)

  const fetchAttendanceStatus = async () => {
    try {
      const response = await fetch(`/api/attendance?userId=${userId}`)
      const result = await response.json()
      
      if (result.success) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayRecord = result.data.find((record: any) => {
          const recordDate = new Date(record.createdAt)
          return recordDate >= today && recordDate < tomorrow
        })

        const canPunchIn = !todayRecord || !todayRecord.punchInTime
        const canPunchOut = todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime

        setAttendanceStatus({
          todayRecord,
          canPunchIn,
          canPunchOut
        })
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error)
    }
  }

  const getCurrentLocation = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraError(null)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraError('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const captureSelfie = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const handleCaptureSelfie = async () => {
    setIsCapturing(true)
    try {
      await startCamera()
      setShowCamera(true)
    } catch (error) {
      setCameraError('Failed to start camera. Please check permissions.')
      setIsCapturing(false)
    }
  }

  const handleRetakeSelfie = () => {
    setCapturedSelfie(null)
  }

  const handleConfirmSelfie = () => {
    stopCamera()
    setShowCamera(false)
    setIsCapturing(false)
  }

  const handleCancelCamera = () => {
    stopCamera()
    setShowCamera(false)
    setCapturedSelfie(null)
    setIsCapturing(false)
  }

  const handlePunchIn = async () => {
    setLoading(true)
    setLocationError(null)
    setCameraError(null)

    try {
      // Get current location
      const currentLocation = await getCurrentLocation()
      setLocation(currentLocation)

      // Capture selfie if camera is available
      let selfie = null
      if (capturedSelfie) {
        selfie = capturedSelfie
      }

      const response = await fetch('/api/attendance/punch-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          location: currentLocation,
          selfie: selfie
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Send WebSocket update
        sendAttendanceUpdate(userId, 'punch-in')
        
        setCapturedSelfie(null)
        await fetchAttendanceStatus()
      } else {
        setLocationError(result.error || 'Failed to punch in')
      }
    } catch (error: any) {
      console.error('Error punching in:', error)
      setLocationError(error.message || 'Failed to get location or punch in')
    } finally {
      setLoading(false)
    }
  }

  const handlePunchOut = async () => {
    setLoading(true)
    setLocationError(null)
    setCameraError(null)

    try {
      // Get current location
      const currentLocation = await getCurrentLocation()
      setLocation(currentLocation)

      // Capture selfie if camera is available
      let selfie = null
      if (capturedSelfie) {
        selfie = capturedSelfie
      }

      const response = await fetch('/api/attendance/punch-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          location: currentLocation,
          selfie: selfie
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Send WebSocket update
        sendAttendanceUpdate(userId, 'punch-out')
        
        setCapturedSelfie(null)
        await fetchAttendanceStatus()
      } else {
        setLocationError(result.error || 'Failed to punch out')
      }
    } catch (error: any) {
      console.error('Error punching out:', error)
      setLocationError(error.message || 'Failed to get location or punch out')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceStatus()
  }, [])

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Punch</h1>
          <p className="text-muted-foreground">Punch in and out to track your attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      {attendanceUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {attendanceUpdates.map((update, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                    <div className={`w-2 h-2 rounded-full ${
                      update.action === 'punch-in' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="flex-1">{update.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={clearUpdates}>
                Clear Updates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceStatus.todayRecord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(attendanceStatus.todayRecord.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(attendanceStatus.todayRecord.status)}
                        {attendanceStatus.todayRecord.status.replace('_', ' ')}
                      </div>
                    </Badge>
                    {attendanceStatus.todayRecord.totalHours && (
                      <span className="text-sm text-muted-foreground">
                        Total Hours: {attendanceStatus.todayRecord.totalHours}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Play className="h-4 w-4 text-green-600" />
                    Punch In
                  </div>
                  <div className="text-lg font-semibold">
                    {formatTime(attendanceStatus.todayRecord.punchInTime)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Square className="h-4 w-4 text-red-600" />
                    Punch Out
                  </div>
                  <div className="text-lg font-semibold">
                    {formatTime(attendanceStatus.todayRecord.punchOutTime)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance record for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Punch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Punch Actions</CardTitle>
          <CardDescription>
            {attendanceStatus.canPunchIn && "Punch in to start your workday"}
            {attendanceStatus.canPunchOut && "Punch out to end your workday"}
            {!attendanceStatus.canPunchIn && !attendanceStatus.canPunchOut && "You have completed today's attendance"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            )}
            
            {locationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            {cameraError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {/* Selfie Capture Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selfie (Optional)</span>
                {capturedSelfie ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Selfie captured</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No selfie captured</span>
                )}
              </div>

              {capturedSelfie && (
                <div className="flex items-center justify-center">
                  <img 
                    src={capturedSelfie} 
                    alt="Captured selfie" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Dialog open={showCamera} onOpenChange={setShowCamera}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCaptureSelfie}
                      disabled={isCapturing}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {capturedSelfie ? 'Retake Selfie' : 'Capture Selfie'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Capture Selfie</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {cameraError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{cameraError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {!capturedSelfie ? (
                        <div className="space-y-4">
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <video 
                              ref={videoRef}
                              autoPlay 
                              playsInline 
                              muted
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button 
                              onClick={() => {
                                const selfie = captureSelfie()
                                if (selfie) {
                                  setCapturedSelfie(selfie)
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Capture
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelCamera}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center">
                            <img 
                              src={capturedSelfie} 
                              alt="Captured selfie" 
                              className="w-48 h-48 rounded-full object-cover border-2 border-green-500"
                            />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button 
                              onClick={handleConfirmSelfie}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleRetakeSelfie}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Retake
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {capturedSelfie && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRetakeSelfie}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              {attendanceStatus.canPunchIn && (
                <Button 
                  onClick={handlePunchIn} 
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Punch In
                    </>
                  )}
                </Button>
              )}

              {attendanceStatus.canPunchOut && (
                <Button 
                  onClick={handlePunchOut} 
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Punch Out
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Make sure your location services are enabled</p>
            <p>• Punch in when you start your workday</p>
            <p>• Punch out when you end your workday</p>
            <p>• Your location will be recorded for attendance verification</p>
            <p>• Optional: Capture a selfie for additional verification</p>
            <p>• Late arrivals will be automatically marked based on your shift timing</p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for selfie capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}