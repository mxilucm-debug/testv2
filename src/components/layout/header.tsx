"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  userRole: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
  userName: string
  userAvatar?: string
  currentView?: string
  onViewChange?: (view: string) => void
}

export function Header({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  userRole, 
  userName, 
  userAvatar,
  currentView,
  onViewChange
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    sessionStorage.clear()
    
    // Redirect to login page
    window.location.href = '/login'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "MANAGER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "EMPLOYEE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin"
      case "ADMIN":
        return "Admin"
      case "MANAGER":
        return "Manager"
      case "EMPLOYEE":
        return "Employee"
      default:
        return role
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        sidebarCollapsed ? "left-16" : "left-72"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4 px-6">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Search Bar */}
        <div className={cn(
          "relative transition-all duration-300",
          searchOpen ? "w-80" : "w-64"
        )}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 px-6">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>
          
          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg"
            >
              <div className="p-4">
                <h3 className="font-semibold">Notifications</h3>
                <div className="mt-2 space-y-2">
                  <div className="rounded-lg bg-accent p-3">
                    <p className="text-sm font-medium">New task assigned</p>
                    <p className="text-xs text-muted-foreground">You have a new task from your manager</p>
                  </div>
                  <div className="rounded-lg bg-accent p-3">
                    <p className="text-sm font-medium">Leave approved</p>
                    <p className="text-xs text-muted-foreground">Your leave request has been approved</p>
                  </div>
                  <div className="rounded-lg bg-accent p-3">
                    <p className="text-sm font-medium">Payroll generated</p>
                    <p className="text-xs text-muted-foreground">Your payslip for this month is ready</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium">{userName}</p>
              <Badge variant="secondary" className={cn("text-xs", getRoleBadgeColor(userRole))}>
                {getRoleLabel(userRole)}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-popover shadow-lg"
            >
              <div className="p-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback>{userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <Badge variant="secondary" className={cn("text-xs", getRoleBadgeColor(userRole))}>
                      {getRoleLabel(userRole)}
                    </Badge>
                  </div>
                </div>
                <div className="border-t my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (onViewChange) {
                      onViewChange("profile")
                      setUserMenuOpen(false)
                    }
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (onViewChange) {
                      onViewChange("settings")
                      setUserMenuOpen(false)
                    }
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <div className="border-t my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}