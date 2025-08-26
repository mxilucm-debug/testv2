'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

interface AttendanceUpdate {
  userId: string
  action: 'punch-in' | 'punch-out'
  timestamp: string
  message: string
}

export const useAttendanceSocket = (workspaceId: string) => {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [attendanceUpdates, setAttendanceUpdates] = useState<AttendanceUpdate[]>([])

  useEffect(() => {
    if (!workspaceId) return

    const socketInstance = io({
      path: '/api/socketio',
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setIsConnected(true)
      // Join workspace room
      socketInstance.emit('join-workspace', workspaceId)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('attendance-updated', (update: AttendanceUpdate) => {
      setAttendanceUpdates(prev => [...prev, update])
      
      // Auto-remove old updates (keep only last 10)
      setAttendanceUpdates(prev => prev.slice(-10))
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [workspaceId])

  const sendAttendanceUpdate = (userId: string, action: 'punch-in' | 'punch-out') => {
    if (socket && isConnected) {
      socket.emit('attendance-update', {
        workspaceId,
        userId,
        action,
        timestamp: new Date().toISOString()
      })
    }
  }

  const clearUpdates = () => {
    setAttendanceUpdates([])
  }

  return {
    isConnected,
    attendanceUpdates,
    sendAttendanceUpdate,
    clearUpdates
  }
}