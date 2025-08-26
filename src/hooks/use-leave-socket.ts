'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

interface LeaveUpdate {
  userId: string
  action: 'submitted' | 'approved' | 'rejected'
  leaveRequestId: string
  timestamp: string
  message: string
  details?: any
}

interface LeaveStatusChange {
  leaveRequestId: string
  status: 'approved' | 'rejected'
  timestamp: string
  message: string
  details?: any
}

export const useLeaveSocket = (workspaceId: string, userId?: string) => {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [leaveUpdates, setLeaveUpdates] = useState<LeaveUpdate[]>([])
  const [leaveStatusChanges, setLeaveStatusChanges] = useState<LeaveStatusChange[]>([])

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
      
      // Join user room if userId is provided
      if (userId) {
        socketInstance.emit('join-user', userId)
      }
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('leave-request-updated', (update: LeaveUpdate) => {
      setLeaveUpdates(prev => [...prev, update])
      
      // Auto-remove old updates (keep only last 20)
      setLeaveUpdates(prev => prev.slice(-20))
    })

    socketInstance.on('leave-request-status-changed', (change: LeaveStatusChange) => {
      setLeaveStatusChanges(prev => [...prev, change])
      
      // Auto-remove old changes (keep only last 10)
      setLeaveStatusChanges(prev => prev.slice(-10))
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [workspaceId, userId])

  const sendLeaveUpdate = (userId: string, action: 'submitted' | 'approved' | 'rejected', leaveRequestId: string, details?: any) => {
    if (socket && isConnected) {
      socket.emit('leave-request-update', {
        workspaceId,
        userId,
        action,
        leaveRequestId,
        timestamp: new Date().toISOString(),
        details
      })
    }
  }

  const clearUpdates = () => {
    setLeaveUpdates([])
  }

  const clearStatusChanges = () => {
    setLeaveStatusChanges([])
  }

  return {
    isConnected,
    leaveUpdates,
    leaveStatusChanges,
    sendLeaveUpdate,
    clearUpdates,
    clearStatusChanges
  }
}