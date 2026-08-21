import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { FileText, Sparkles, Shield, Zap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    title: 'StatementFlow - Smart Bank Statement to Cashbook Automation',
    description: 'Automatically extract transactions from bank statement PDFs and write them into your existing Excel cashbook template. Save hours of manual data entry with AI-powered automation.',
    'og:title': 'StatementFlow - Smart Bank Statement to Cashbook Automation',
    'og:description': 'Automatically extract transactions from bank statement PDFs and write them into your existing Excel cashbook template.',
    'og:type': 'website',
  }),
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            StatementFlow
          </h1>
          <p className="text-xl text-text-secondary mb-2">
            by NEHANDA Technical
          </p>
          <p className="text-2xl text-accent font-semibold mb-8">
            Smart Bank Statement to Cashbook Automation
          </p>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Extract transactions from bank statement PDFs and automatically write them into your existing Excel cashbook template. Non-destructive, accurate, and incredibly fast.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-surface-alt">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-text-primary mb-12">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-accent mb-4" />
                <CardTitle>PDF Extraction</CardTitle>
                <CardDescription>
                  Upload bank statement PDFs and let AI extract all transaction data automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-12 w-12 text-accent mb-4" />
                <CardTitle>AI-Powered Categorization</CardTitle>
                <CardDescription>
                  Smart categorization using merchant mappings, keyword rules, and AI fallback
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Non-Destructive Export</CardTitle>
                <CardDescription>
                  Append transactions to your existing templates without overwriting any data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Process hundreds of transactions in seconds, not hours
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Analysis</CardTitle>
                <CardDescription>
                  Automatically detect your cashbook layout and map categories correctly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Bank-level security with user-isolated storage and complete data privacy
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to Automate Your Cashbook?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Join hundreds of businesses already saving hours every month with StatementFlow
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-text-muted">
        <p>Developed by NEHANDA Technical©</p>
      </footer>
    </div>
  )
}