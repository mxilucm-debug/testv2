"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Users, 
  User, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  BarChart3,
  CheckSquare,
  Clock,
  DollarSign,
  FileCheck,
  Bell,
  Search,
  Menu,
  FileBarChart,
  Download
} from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  userRole: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
  currentView?: string
  onViewChange?: (view: string) => void
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: string
  roles?: string[]
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Team",
    icon: Users,
    href: "/team",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    title: "Profile",
    icon: User,
    href: "/profile",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Attendance",
    icon: Clock,
    href: "/attendance",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Leave",
    icon: Calendar,
    href: "/leave",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Payroll",
    icon: DollarSign,
    href: "/payroll",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/documents",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    title: "Reports",
    icon: FileBarChart,
    href: "/reports",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    children: [
      {
        title: "Generate Reports",
        icon: FileBarChart,
        href: "/reports",
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
      },
      {
        title: "Download Reports",
        icon: Download,
        href: "/report-downloads",
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
      }
    ]
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["SUPER_ADMIN", "ADMIN"]
  }
]

export function Sidebar({ collapsed, setCollapsed, userRole, currentView, onViewChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const filteredItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)

    // Check if icon is defined
    if (!item.icon) {
      console.error(`Icon is undefined for item: ${item.title}`)
      return null
    }

    if (hasChildren) {
      const filteredChildren = item.children.filter(child => 
        !child.roles || child.roles.includes(userRole)
      )

      if (filteredChildren.length === 0) return null

      return (
        <div className="w-full">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              collapsed && "justify-center px-2",
              level > 0 && "pl-4"
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon className={cn("h-4 w-4", collapsed && "mr-0", !collapsed && "mr-2")} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft className="h-3 w-3" />
                </motion.div>
              </>
            )}
          </Button>
          
          <AnimatePresence>
            {isExpanded && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-1">
                  {filteredChildren.map((child) => (
                    <NavItemComponent key={child.title} item={child} level={level + 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-muted-foreground hover:text-foreground",
          collapsed && "justify-center px-2",
          level > 0 && "pl-4",
          currentView === item.href?.substring(1) && "bg-accent text-accent-foreground"
        )}
        onClick={() => {
          if (item.href && onViewChange) {
            const view = item.href.substring(1) // Remove the leading slash
            if (view === "dashboard" || view === "settings" || view === "analytics" || view === "profile" || view === "team" || view === "attendance" || view === "leave" || view === "tasks" || view === "documents" || view === "payroll" || view === "reports" || view === "report-downloads") {
              onViewChange(view)
            }
          }
        }}
      >
        <item.icon className={cn("h-4 w-4", collapsed && "mr-0", !collapsed && "mr-2")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    )
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "relative flex flex-col border-r bg-background",
        collapsed ? "items-center py-4" : "py-6"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center", collapsed ? "justify-center" : "px-6 mb-8")}>
        <Building2 className="h-8 w-8 text-primary" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="ml-3 text-xl font-bold"
          >
            HRMS
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <NavItemComponent key={item.title} item={item} />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className={cn(
        "mt-auto border-t pt-4",
        collapsed ? "px-2" : "px-6"
      )}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className={cn("h-4 w-4", collapsed && "mr-0", !collapsed && "mr-2")} />
          {!collapsed && "Settings"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("h-4 w-4", collapsed && "mr-0", !collapsed && "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute -right-3 top-1/2 h-6 w-6 rounded-full border bg-background shadow-md",
          collapsed && "rotate-180"
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
    </motion.div>
  )
}