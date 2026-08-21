import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Badge } from '#/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { supabase } from '#/lib/supabase'
import { analyzeTemplate } from '#/lib/server-functions'
import { FileSpreadsheet, Upload, Eye, Trash2, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/authenticated/templates')({
  component: Templates,
  head: () => ({
    title: 'Templates - StatementFlow',
    description: 'Upload and analyze your Excel cashbook templates',
    'og:title': 'Templates - StatementFlow',
    'og:description': 'Upload and analyze your Excel cashbook templates',
    'og:type': 'website',
  }),
})

function Templates() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedTemplate, setAnalyzedTemplate] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !templateName) return

    setAnalyzing(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(`${user.id}/${fileName}`, file)

      if (uploadError) throw uploadError

      // Analyze template
      const result = await analyzeTemplate({
        fileId: uploadData.path,
        name: templateName,
      })

      if (result.success) {
        setAnalyzedTemplate(result.fieldMapping)
        setUploadDialogOpen(false)
        setTemplateName('')
        setFile(null)
        // Refetch would go here
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const { data: template } = await supabase
        .from('templates')
        .select('storage_path')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single()

      if (template) {
        // Delete from storage
        await supabase.storage
          .from('templates')
          .remove([template.storage_path])
      }

      // Delete from database
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id)

      if (error) throw error
      // Refetch would go here
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const getLayoutTypeBadge = (layoutType: string) => {
    switch (layoutType) {
      case 'A':
        return <Badge variant="secondary">Single Ledger</Badge>
      case 'B':
        return <Badge variant="warning">Columnar Block</Badge>
      case 'C':
        return <Badge variant="success">Two-Sided Cashbook</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Templates</h1>
          <p className="text-text-secondary mt-2">
            Upload and analyze your Excel cashbook templates for automatic export
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Cashbook Template</DialogTitle>
              <DialogDescription>
                Upload your Excel cashbook template for automatic analysis and mapping
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Cashbook 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Excel File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-text-muted">Maximum file size: 10 MB</p>
              </div>
              <Button type="submit" className="w-full" disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Upload & Analyze'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {analyzedTemplate && (
        <Card className="border-accent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <CardTitle>Template Analysis Complete</CardTitle>
            </div>
            <CardDescription>
              Your template has been analyzed and categories have been auto-discovered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Layout Type</h4>
                {getLayoutTypeBadge(analyzedTemplate.layoutType)}
              </div>
              <div>
                <h4 className="font-medium mb-2">Detected Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {analyzedTemplate.discoveredCategories?.map((cat: string) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => setAnalyzedTemplate(null)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No templates yet</h3>
              <p className="text-text-muted mb-4">
                Upload your Excel cashbook template to enable automatic exports
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Layout Type</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const mapping = template.field_mapping as any
                  return (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getLayoutTypeBadge(mapping?.layoutType)}</TableCell>
                      <TableCell>
                        {mapping?.discoveredCategories?.length || 0} categories
                      </TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAnalyzedTemplate(mapping)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}