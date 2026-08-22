
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Info, Mail, Globe } from 'lucide-react'


export default function About( {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">About StatementFlow</h1>
        <p className="text-text-secondary mt-2">
          Smart Bank Statement to Cashbook Automation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is StatementFlow?</CardTitle>
          <CardDescription>
            Your intelligent financial automation assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-text-secondary">
            <p>
              StatementFlow is a powerful web application that automates the tedious process of extracting transactions from bank statement PDFs and writing them into your existing Excel cashbook templates. Built with cutting-edge AI technology, it saves you hours of manual data entry while maintaining accuracy and data integrity.
            </p>
            <p>
              Our intelligent system can automatically categorize transactions using merchant mappings, keyword rules, and AI-powered pattern recognition, ensuring your financial records are always organized and up-to-date.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            What makes StatementFlow different
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-light rounded-lg">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">AI-Powered Extraction</h4>
                <p className="text-sm text-text-secondary">
                  Advanced AI models accurately extract transaction data from PDF bank statements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-light rounded-lg">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Smart Categorization</h4>
                <p className="text-sm text-text-secondary">
                  Automatic categorization using merchant mappings, keyword rules, and AI fallback
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-light rounded-lg">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Non-Destructive Export</h4>
                <p className="text-sm text-text-secondary">
                  Append transactions to your existing templates without overwriting any data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-light rounded-lg">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Template Analysis</h4>
                <p className="text-sm text-text-secondary">
                  Automatically detect your cashbook layout and map categories correctly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent-light rounded-lg">
                <Info className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Secure & Private</h4>
                <p className="text-sm text-text-secondary">
                  Bank-level security with user-isolated storage and complete data privacy
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About NEHANDA Technical</CardTitle>
          <CardDescription>
            The team behind StatementFlow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-text-secondary">
            <p>
              NEHANDA Technical is a technology company focused on building innovative solutions that streamline business processes and enhance productivity. With expertise in financial automation, AI integration, and web development, we create tools that help businesses work smarter.
            </p>
            <p>
              Our mission is to leverage cutting-edge technology to solve real-world business challenges, making financial management accessible and efficient for organizations of all sizes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>
            Get in touch with our team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <span className="text-text-secondary">info@nehanda.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <span className="text-text-secondary">www.nehanda.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <span className="text-text-secondary">github.com/nehanda</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
          <CardDescription>
            Current application version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Build</span>
              <span className="font-medium">2024.08.19</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Platform</span>
              <span className="font-medium">Web</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  
}







