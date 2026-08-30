import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, CreditCard, Tag, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    statementsCount: 0,
    transactionsCount: 0,
    categorizedCount: 0,
    categoriesCount: 0,
    monthlyCashFlow: [],
    recentStatements: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        // Get total statements
        const { count: statementsCount } = await supabase
          .from('bank_statements')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get total transactions
        const { count: transactionsCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('bank_statements.user_id', user.id)

        // Get categorized transactions
        const { count: categorizedCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('bank_statements.user_id', user.id)
          .not('category', 'is', null)

        // Get total categories
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get monthly cash flow data
        const { data: monthlyData } = await supabase
          .from('transactions')
          .select('date, debit, credit')
          .eq('bank_statements.user_id', user.id)
          .order('date', { ascending: true })

        // Process monthly data
        const monthlyCashFlow = processMonthlyData(monthlyData || [])

        // Get recent statements
        const { data: recentStatements } = await supabase
          .from('bank_statements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setStats({
          statementsCount: statementsCount || 0,
          transactionsCount: transactionsCount || 0,
          categorizedCount: categorizedCount || 0,
          categoriesCount: categoriesCount || 0,
          monthlyCashFlow,
          recentStatements: recentStatements || [],
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const categorizationAccuracy = stats.transactionsCount > 0
    ? Math.round((stats.categorizedCount / stats.transactionsCount) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Welcome back! Here's your financial overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
            <FileText className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statementsCount}</div>
            <p className="text-xs text-text-muted">Bank statements processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionsCount}</div>
            <p className="text-xs text-text-muted">Transactions extracted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoriesCount}</div>
            <p className="text-xs text-text-muted">Custom categories created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorization Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorizationAccuracy}%</div>
            <p className="text-xs text-text-muted">
              {stats.categorizedCount} of {stats.transactionsCount} categorized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>Your income vs expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Statements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Statements</CardTitle>
          <CardDescription>Your latest bank statement uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentStatements.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No statements uploaded yet. Upload your first bank statement to get started.
            </div>
           ) : (
            <div className="space-y-4">
              {stats.recentStatements.map((statement) => (
                <div key={statement.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-surface-alt rounded-lg">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium">{statement.bank_name}</div>
                      <div className="text-sm text-text-muted">{statement.period}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{statement.transaction_count} transactions</div>
                      <div className="text-xs text-text-muted">
                        {statement.status === 'completed' && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-success" />
                            Completed
                          </span>
                        )}
                        {statement.status === 'processing' && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-warning" />
                            Processing
                          </span>
                        )}
                        {statement.status === 'failed' && (
                          <span className="flex items-center gap-1 text-danger">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/statements"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface-alt transition-colors"
            >
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <div className="font-medium">Upload Statement</div>
                <div className="text-sm text-text-muted">Add a new bank statement</div>
              </div>
            </a>
            <a
              href="/transactions"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface-alt transition-colors"
            >
              <CreditCard className="h-5 w-5 text-accent" />
              <div>
                <div className="font-medium">Review Transactions</div>
                <div className="text-sm text-text-muted">Categorize and edit transactions</div>
              </div>
            </a>
            <a
              href="/exports"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface-alt transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-accent" />
              <div>
                <div className="font-medium">Export Cashbook</div>
                <div className="text-sm text-text-muted">Generate Excel export</div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function processMonthlyData(transactions: any[]) {
  const monthlyMap = new Map<string, { income: number; expenses: number }>()

  transactions.forEach((t) => {
    const date = new Date(t.date)
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expenses: 0 })
    }

    const data = monthlyMap.get(monthKey)!
    if (t.credit > 0) {
      data.income += t.credit
    }
    if (t.debit > 0) {
      data.expenses += t.debit
    }
  })

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    income: data.income,
    expenses: data.expenses,
  }))
}
