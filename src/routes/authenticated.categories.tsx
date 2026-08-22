
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { supabase } from '../lib/supabase'
import { Tag, Plus, Edit, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/authenticated/categories')({
  component: Categories,
  head: () => ({
    title: 'Categories - StatementFlow',
    description: 'Manage your transaction categories',
    'og:title': 'Categories - StatementFlow',
    'og:description': 'Manage your transaction categories',
    'og:type': 'website',
  }),
})

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [side, setSide] = useState<'debit' | 'credit' | 'both'>('both')
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name,
            description,
            side,
          })
          .eq('id', editingCategory.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name,
            description,
            side,
          })

        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || '')
    setSide(category.side)
    setDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) throw error
      refetch()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setSide('both')
  }

  const getSideBadge = (side: string) => {
    switch (side) {
      case 'debit':
        return <Badge variant="destructive">Debit</Badge>
      case 'credit':
        return <Badge variant="success">Credit</Badge>
      default:
        return <Badge variant="secondary">Both</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Categories</h1>
          <p className="text-text-secondary mt-2">
            Manage your transaction categories for better organization
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details'
                  : 'Create a new category for organizing transactions'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Office Supplies"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <select
                  id="side"
                  value={side}
                  onChange={(e) => setSide(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface"
                >
                  <option value="both">Both (Income & Expenses)</option>
                  <option value="debit">Debit (Expenses Only)</option>
                  <option value="credit">Credit (Income Only)</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
          <CardDescription>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No categories yet</h3>
              <p className="text-text-muted mb-4">
                Create categories to organize your transactions better
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-text-muted">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>{getSideBadge(category.side)}</TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
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
