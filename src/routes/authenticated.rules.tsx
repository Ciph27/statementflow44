
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { supabase } from '../lib/supabase'
import { Sparkles, Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'


export default function Rules() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [keyword, setKeyword] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState(0)
  const [rules, setRules] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        const { data: rulesData, error: rulesError } = await supabase
          .from('rules')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .order('priority', { ascending: false })

        if (rulesError) throw rulesError
        setRules(rulesData || [])

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      if (editingRule) {
        const { error } = await supabase
          .from('rules')
          .update({
            keyword,
            is_regex: isRegex,
            category_id: categoryId,
            priority,
          })
          .eq('id', editingRule.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rules')
          .insert({
            user_id: user.id,
            keyword,
            is_regex: isRegex,
            category_id: categoryId,
            priority,
          })

        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      // Refetch would go here
    } catch (error) {
      console.error('Failed to save rule:', error)
      alert('Failed to save rule')
    }
  }

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
    setKeyword(rule.keyword)
    setIsRegex(rule.is_regex)
    setCategoryId(rule.category_id)
    setPriority(rule.priority)
    setDialogOpen(true)
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id)

      if (error) throw error
      // Refetch would go here
    } catch (error) {
      console.error('Failed to delete rule:', error)
      alert('Failed to delete rule')
    }
  }

  const handlePriorityChange = async (ruleId: string, newPriority: number) => {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('rules')
        .update({ priority: newPriority })
        .eq('id', ruleId)
        .eq('user_id', user.id)

      if (error) throw error
      // Refetch would go here
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  const resetForm = () => {
    setEditingRule(null)
    setKeyword('')
    setIsRegex(false)
    setCategoryId('')
    setPriority(0)
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Rules Engine</h1>
          <p className="text-text-secondary mt-2">
            Create automatic categorization rules using keywords and patterns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Rule' : 'Add Rule'}
              </DialogTitle>
              <DialogDescription>
                {editingRule
                  ? 'Update the categorization rule'
                  : 'Create a new automatic categorization rule'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword or Pattern</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., SPAR, Shoprite, ^Transfer .*$"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRegex"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="isRegex">Use regular expression</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Target Category</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (higher = checked first)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRule ? 'Update Rule' : 'Add Rule'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Rules</CardTitle>
          <CardDescription>
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No rules yet</h3>
              <p className="text-text-muted mb-4">
                Create rules to automatically categorize transactions based on keywords
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword/Pattern</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {rule.keyword}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_regex ? 'warning' : 'secondary'}>
                        {rule.is_regex ? 'Regex' : 'Keyword'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCategoryName(rule.category_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePriorityChange(rule.id, rule.priority + 1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">{rule.priority}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePriorityChange(rule.id, Math.max(0, rule.priority - 1))}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule.id)}
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
