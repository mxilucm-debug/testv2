"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  workspaceId: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "user-1",
    name: "John Manager",
    email: "john@example.com",
    role: "MANAGER",
    workspaceId: "workspace-1"
  })

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getCurrentUser() {
  // For now, return a mock user
  // In a real app, this would come from the auth context or JWT token
  return {
    id: "user-1",
    name: "John Manager",
    email: "john@example.com",
    role: "MANAGER" as const,
    workspaceId: "workspace-1"
  }
}