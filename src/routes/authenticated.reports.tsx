import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/authenticated/reports')({
  component: Reports,
  head: () => ({
    title: 'Reports - StatementFlow',
    description: 'View financial reports and analytics',
    'og:title': 'Reports - StatementFlow',
    'og:description': 'View financial reports and analytics',
    'og:type': 'website',
  }),
})

function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-secondary mt-2">
          View detailed financial reports and analytics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Advanced reporting features are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Reports Coming Soon</h3>
            <p className="text-text-muted">
              We're working on advanced financial reports including income statements, balance sheets, and custom analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
