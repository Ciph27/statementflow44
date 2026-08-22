
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import { exportCashbook, previewExport } from '../lib/server-functions'
import { Download, Eye, FileSpreadsheet, CheckCircle, Clock, XCircle } from 'lucide-react'


export default function Exports( {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null
  const [previewData, setPreviewData] = useState<any>(null
  const [exporting, setExporting] = useState(false
  const [previewing, setPreviewing] = useState(false
  const [templates, setTemplates] = useState<any[]>([]
  const [transactions, setTransactions] = useState<any[]>([]
  const [exports, setExports] = useState<any[]>([]
  const [loading, setLoading] = useState(true

  useEffect(( => {
    const fetchData = async ( => {
      try {
        const user = (await supabase.auth.getUser(.data.user
        if (!user throw new Error('Not authenticated'

        const { data: templatesData, error: templatesError } = await supabase
          .from('templates'
          .select('*'
          .eq('user_id', user.id
          .order('created_at', { ascending: false }

        if (templatesError throw templatesError
        setTemplates(templatesData || []

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions'
          .select('id, date, description, merchant, debit, credit, category, side'
          .eq('bank_statements.user_id', user.id
          .order('date', { ascending: false }

        if (transactionsError throw transactionsError
        setTransactions(transactionsData || []

        const { data: exportsData, error: exportsError } = await supabase
          .from('exports'
          .select('*, templates(name'
          .eq('user_id', user.id
          .order('created_at', { ascending: false }

        if (exportsError throw exportsError
        setExports(exportsData || []
      } catch (error {
        console.error('Failed to fetch data:', error
      } finally {
        setLoading(false
      }
    }

    fetchData(
  }, []

  const refetch = ( => {
    setLoading(true
    setTimeout(( => setLoading(false, 500
  }

  const handlePreview = async (templateId: string => {
    setPreviewing(true
    setSelectedTemplate(templateId
    try {
      const transactionIds = transactions.map(t => t.id
      const result = await previewExport({
        templateId,
        transactionIds,
      }

      if (result.success {
        setPreviewData(result
        setPreviewDialogOpen(true
      }
    } catch (error {
      console.error('Preview failed:', error
      alert('Failed to generate preview'
    } finally {
      setPreviewing(false
    }
  }

  const handleExport = async (templateId: string => {
    setExporting(true
    try {
      const transactionIds = transactions.map(t => t.id
      const result = await exportCashbook({
        templateId,
        transactionIds,
      }

      if (result.success && result.downloadUrl {
        window.open(result.downloadUrl, '_blank'
        refetch(
      }
    } catch (error {
      console.error('Export failed:', error
      alert('Export failed. Please try again.'
    } finally {
      setExporting(false
    }
  }

  const getStatusBadge = (status: string => {
    switch (status {
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

  const getStatusIcon = (status: string => {
    switch (status {
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
          <h1 className="text-3xl font-bold text-text-primary">Exports</h1>
          <p className="text-text-secondary mt-2">
            Generate Excel exports from your transactions using custom templates
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Export</CardTitle>
          <CardDescription>
            Select a template and preview your export before downloading
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No templates available</h3>
              <p className="text-text-muted mb-4">
                Upload a template first to create exports
              </p>
              <Button onClick={( => (window.location.href = '/templates'}>
                Upload Template
              </Button>
            </div>
           : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template => (
                <Card key={template.id} className="hover:border-accent transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      {transactions.length} transactions ready for export
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={( => handlePreview(template.id}
                        disabled={previewing}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={( => handleExport(template.id}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              }
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Your previous exports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No exports yet. Create your first export above.
            </div>
           : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">
                      {(exp.templates as any?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{exp.row_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exp.status}
                        {getStatusBadge(exp.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {new Date(exp.created_at.toLocaleString(}
                    </TableCell>
                    <TableCell>
                      {exp.status === 'completed' && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      }
                    </TableCell>
                  </TableRow>
                }
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Preview</DialogTitle>
            <DialogDescription>
              Preview of your export before downloading
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Debit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-danger">
                      ${previewData.totals.debit.toFixed(2}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Credit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      ${previewData.totals.credit.toFixed(2}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Closing Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${previewData.totals.balance.toFixed(2}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.preview.map((item: any => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell className={item.debit > 0 ? 'text-danger' : ''}>
                        {item.debit > 0 ? `$${item.debit.toFixed(2}` : '-'}
                      </TableCell>
                      <TableCell className={item.credit > 0 ? 'text-success' : ''}>
                        {item.credit > 0 ? `$${item.credit.toFixed(2}` : '-'}
                      </TableCell>
                      <TableCell>{item.category || 'Uncategorized'}</TableCell>
                    </TableRow>
                  }
                </TableBody>
              </Table>
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>
  
}







