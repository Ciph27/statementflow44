import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { supabase } from '#/lib/supabase'
import { updateTransactionCategory, updateTransactionDescription, saveMatchingRule, applyAllRules } from '#/lib/server-functions'
import { CreditCard, Wand, RefreshCw, Search, Filter } from 'lucide-react'

export const Route = createFileRoute('/authenticated/transactions')({
  component: Transactions,
  head: () => ({
    title: 'Transactions - StatementFlow',
    description: 'Review, categorize, and edit your transactions',
    'og:title': 'Transactions - StatementFlow',
    'og:description': 'Review, categorize, and edit your transactions',
    'og:type': 'website',
  }),
})

function Transactions() {
  const search = useSearch({ from: '/authenticated/transactions' })
  const statementId = search.statementId as string | undefined

  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [applyingRules, setApplyingRules] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        let query = supabase
          .from('transactions')
          .select('*, categories(name, side)')
          .eq('bank_statements.user_id', user.id)

        if (statementId) {
          query = query.eq('statement_id', statementId)
        }

        const { data: transData, error: transError } = await query.order('date', { ascending: false })
        if (transError) throw transError
        setTransactions(transData || [])

        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (catError) throw catError
        setCategories(catData || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [statementId])

  const refetch = () => {
    setLoading(true)
    // Re-fetch logic would go here
    setTimeout(() => setLoading(false), 500)
  }

  const handleSaveDescription = async (transactionId: string) => {
    try {
      await updateTransactionDescription({
        transactionId,
        description: editDescription,
      })
      setEditingTransaction(null)
      refetch()
    } catch (error) {
      console.error('Failed to update description:', error)
      alert('Failed to update description')
    }
  }

  const handleCategoryChange = async (transactionId: string, categoryId: string | null) => {
    try {
      await updateTransactionCategory({
        transactionId,
        categoryId,
      })
      refetch()
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('Failed to update category')
    }
  }

  const handleSaveAsRule = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction || !transaction.category) return

    try {
      await saveMatchingRule({
        transactionId,
        categoryId: transaction.category,
      })
      alert('Rule saved successfully')
    } catch (error) {
      console.error('Failed to save rule:', error)
      alert('Failed to save rule')
    }
  }

  const handleApplyAllRules = async () => {
    setApplyingRules(true)
    try {
      const result = await applyAllRules()
      alert(`Applied rules to ${result.updatedCount} transactions`)
      refetch()
    } catch (error) {
      console.error('Failed to apply rules:', error)
      alert('Failed to apply rules')
    } finally {
      setApplyingRules(false)
    }
  }

  const getSideCategories = (side: string) => {
    return categories.filter(c => c.side === side || c.side === 'both')
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary mt-2">
            Review, categorize, and edit your extracted transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleApplyAllRules} disabled={applyingRules}>
            <RefreshCw className={`h-4 w-4 mr-2 ${applyingRules ? 'animate-spin' : ''}`} />
            Apply Rules to All
          </Button>
        </div>
      </div>

      {statementId && (
        <div className="flex items-center justify-between p-4 bg-accent-light rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="success">Filtered</Badge>
            <span className="text-sm">Showing transactions for selected statement</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/transactions'}>
            Clear Filter
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No transactions yet</h3>
              <p className="text-text-muted mb-4">
                Upload a bank statement to extract transactions automatically
              </p>
              <Button onClick={() => (window.location.href = '/statements')}>
                Upload Statement
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        {editingTransaction === transaction.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="flex-1 px-2 py-1 border border-border rounded text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveDescription(transaction.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTransaction(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="group relative">
                            <div
                              className="cursor-pointer hover:bg-surface-alt p-1 rounded"
                              onClick={() => {
                                setEditingTransaction(transaction.id)
                                setEditDescription(transaction.description)
                              }}
                            >
                              {transaction.description}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.merchant}</TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {transaction.reference || '-'}
                      </TableCell>
                      <TableCell className={transaction.debit > 0 ? 'text-danger font-medium' : ''}>
                        {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className={transaction.credit > 0 ? 'text-success font-medium' : ''}>
                        {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.balance ? `$${transaction.balance.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <select
                          value={transaction.category || ''}
                          onChange={(e) => handleCategoryChange(transaction.id, e.target.value || null)}
                          className="px-2 py-1 border border-border rounded text-sm bg-surface"
                        >
                          <option value="">Uncategorized</option>
                          {getSideCategories(transaction.side).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.confidence > 0.8 ? 'success' : transaction.confidence > 0.5 ? 'warning' : 'secondary'}
                        >
                          {Math.round(transaction.confidence * 100)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {transaction.category && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveAsRule(transaction.id)}
                              title="Save as rule"
                            >
                              <Wand className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
