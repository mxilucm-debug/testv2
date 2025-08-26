"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderOpen, Users, TrendingUp } from "lucide-react"

interface DocumentStatsProps {
  stats: {
    total: number
    myDocuments: number
    workspaceDocuments: number
    byType: Record<string, number>
  }
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  pan: "PAN Card",
  aadhaar: "Aadhaar Card",
  contract: "Employment Contract",
  offer_letter: "Offer Letter",
  resume: "Resume/CV",
  certificate: "Certificate",
  id_proof: "ID Proof",
  address_proof: "Address Proof",
  education: "Education Document",
  experience: "Experience Letter",
  salary_slip: "Salary Slip",
  bank_statement: "Bank Statement",
  other: "Other"
}

export function DocumentStats({ stats }: DocumentStatsProps) {
  const topTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All documents in system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Documents</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.myDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Documents uploaded by you
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workspace Documents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.workspaceDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Documents in your workspace
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topTypes.length}</div>
          <p className="text-xs text-muted-foreground">
            Most common document types
          </p>
        </CardContent>
      </Card>

      {/* Document Types Breakdown */}
      {topTypes.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Document Types Breakdown</CardTitle>
            <CardDescription>
              Distribution of documents by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topTypes.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {DOCUMENT_TYPE_LABELS[type] || type}
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}