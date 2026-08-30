
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { ClipboardList } from 'lucide-react'


export default function AuditLog() {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setAuditLogs(data || [])
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { variant: string; label: string }> = {
      'create': { variant: 'success', label: 'Created' },
      'update': { variant: 'warning', label: 'Updated' },
      'delete': { variant: 'destructive', label: 'Deleted' },
      'export': { variant: 'secondary', label: 'Export' },
      'import': { variant: 'secondary', label: 'Import' },
    }

    const mapping = actionMap[action] || { variant: 'secondary', label: action }
    return <Badge variant={mapping.variant as any}>{mapping.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Audit Log</h1>
        <p className="text-text-secondary mt-2">
          Track all account activity and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {auditLogs.length} recent action{auditLogs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No activity yet</h3>
              <p className="text-text-muted">
                Your account activity will appear here
              </p>
            </div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="font-medium">{log.entity}</TableCell>
                    <TableCell className="text-sm text-text-muted max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {new Date(log.created_at).toLocaleString()}
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
