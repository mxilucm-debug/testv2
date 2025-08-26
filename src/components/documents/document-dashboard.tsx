"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "./document-upload"
import { DocumentList } from "./document-list"
import { DocumentStats } from "./document-stats"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { FileText, Upload, FolderOpen, Users } from "lucide-react"

interface Document {
  id: string
  name: string
  type: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  userId?: string
  workspaceId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export function DocumentDashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("my-documents")
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments(prev => [newDocument, ...prev])
    toast({
      title: "Success",
      description: "Document uploaded successfully"
    })
  }

  const handleDocumentUpdated = (updatedDocument: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ))
    toast({
      title: "Success",
      description: "Document updated successfully"
    })
  }

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    toast({
      title: "Success",
      description: "Document deleted successfully"
    })
  }

  const myDocuments = documents.filter(doc => doc.userId === user?.id)
  const workspaceDocuments = documents.filter(doc => doc.workspaceId === user?.workspaceId)

  const getDocumentStats = () => {
    return {
      total: documents.length,
      myDocuments: myDocuments.length,
      workspaceDocuments: workspaceDocuments.length,
      byType: documents.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  const stats = getDocumentStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your documents
          </p>
        </div>
        <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
      </div>

      <DocumentStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Documents
            <Badge variant="secondary">{myDocuments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="workspace-documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Workspace Documents
            <Badge variant="secondary">{workspaceDocuments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all-documents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Documents
            <Badge variant="secondary">{documents.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-documents">
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>
                Documents uploaded by you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={myDocuments}
                onDocumentUpdated={handleDocumentUpdated}
                onDocumentDeleted={handleDocumentDeleted}
                canEdit={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace-documents">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Documents</CardTitle>
              <CardDescription>
                All documents in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={workspaceDocuments}
                onDocumentUpdated={handleDocumentUpdated}
                onDocumentDeleted={handleDocumentDeleted}
                canEdit={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-documents">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                Complete document repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={documents}
                onDocumentUpdated={handleDocumentUpdated}
                onDocumentDeleted={handleDocumentDeleted}
                canEdit={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}