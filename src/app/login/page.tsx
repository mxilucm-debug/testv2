"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Eye, EyeOff, Mail, Lock } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

interface UserCredentials {
  email: string
  password: string
  name: string
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
  workspaceName: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserCredentials | null>(null)

  // Demo user credentials for different roles
  const demoUsers: UserCredentials[] = [
    {
      email: "superadmin@hrms.com",
      password: "superadmin123",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      workspaceName: "System"
    },
    {
      email: "admin@techcorp.com",
      password: "admin123",
      name: "John Admin",
      role: "ADMIN",
      workspaceName: "TechCorp"
    },
    {
      email: "manager@techcorp.com",
      password: "manager123",
      name: "Sarah Manager",
      role: "MANAGER",
      workspaceName: "TechCorp"
    },
    {
      email: "employee@techcorp.com",
      password: "employee123",
      name: "Mike Employee",
      role: "EMPLOYEE",
      workspaceName: "TechCorp"
    },
    {
      email: "admin@startupxyz.com",
      password: "admin123",
      name: "Jane Admin",
      role: "ADMIN",
      workspaceName: "StartupXYZ"
    },
    {
      email: "manager@startupxyz.com",
      password: "manager123",
      name: "David Manager",
      role: "MANAGER",
      workspaceName: "StartupXYZ"
    },
    {
      email: "employee@startupxyz.com",
      password: "employee123",
      name: "Lisa Employee",
      role: "EMPLOYEE",
      workspaceName: "StartupXYZ"
    }
  ]

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(result.data.user))
        localStorage.setItem('authToken', result.data.token)
        
        // Redirect to dashboard
        router.push('/')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyDemoCredentials = (user: UserCredentials) => {
    form.setValue('email', user.email)
    form.setValue('password', user.password)
    setSelectedUser(user)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome to HRMS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Sign in to access your dashboard
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Right Side - Demo Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Demo Users</CardTitle>
                <CardDescription>
                  Click on any user below to auto-fill their credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoUsers.map((user, index) => (
                    <motion.div
                      key={user.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedUser?.email === user.email ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                      onClick={() => applyDemoCredentials(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{user.workspaceName}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {user.password}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    How to use demo users:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Click on any user to auto-fill their credentials</li>
                    <li>• Click "Sign In" to access their dashboard</li>
                    <li>• Each role has different access levels</li>
                    <li>• Super Admin can manage all workspaces</li>
                    <li>• Admin/Manager/Employee have workspace-specific access</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}