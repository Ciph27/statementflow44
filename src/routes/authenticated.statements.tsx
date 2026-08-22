
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import { parseStatement } from '../lib/server-functions'
import { FileText, Upload, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

export const Route = createFileRoute('/authenticated/statements')({
  component: Statements,
  head: () => ({
    title: 'Statements - StatementFlow',
    description: 'Upload and manage your bank statements',
    'og:title': 'Statements - StatementFlow',
    'og:description': 'Upload and manage your bank statements',
    'og:type': 'website',
  }),
})

export default function Statements() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [bankName, setBankName] = useState('')
  const [period, setPeriod] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [statements, setStatements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatements = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('bank_statements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setStatements(data || [])
      } catch (error) {
        console.error('Failed to fetch statements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatements()
  }, [])

  const refetch = () => {
    setLoading(true)
    // Re-fetch logic would go here
    setTimeout(() => setLoading(false), 500)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !bankName || !period) return

    setUploading(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('statements')
        .upload(`${user.id}/${fileName}`, file)

      if (uploadError) throw uploadError

      // Parse statement
      const result = await parseStatement({
        fileId: uploadData.path,
        bankName,
        period,
      })

      if (result.success) {
        setUploadDialogOpen(false)
        setBankName('')
        setPeriod('')
        setFile(null)
        refetch()
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'processing':
        return <Badge variant="warning">Processing</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'processing':
        return <Clock className="h-4 w-4 text-warning" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-danger" />
      default:
        return <Clock className="h-4 w-4 text-text-muted" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Bank Statements</h1>
          <p className="text-text-secondary mt-2">
            Upload and manage your bank statement PDFs
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Statement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Bank Statement</DialogTitle>
              <DialogDescription>
                Upload a PDF bank statement for automatic transaction extraction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., CBZ, Stanbic, FBC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g., January 2024, Q1 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-text-muted">Maximum file size: 15 MB</p>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Statements</CardTitle>
          <CardDescription>
            {statements.length} statement{statements.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No statements yet</h3>
              <p className="text-text-muted mb-4">
                Upload your first bank statement to get started with automatic transaction extraction
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Statement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((statement) => (
                  <TableRow key={statement.id}>
                    <TableCell className="font-medium">{statement.bank_name}</TableCell>
                    <TableCell>{statement.period}</TableCell>
                    <TableCell>{statement.transaction_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(statement.status)}
                        {getStatusBadge(statement.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(statement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {statement.status === 'completed' && (
                        <Link to="/transactions" search={{ statementId: statement.id }}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
