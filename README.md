# StatementFlow

Smart Bank Statement to Cashbook Automation

Built by NEHANDA Technical

## Project Overview

StatementFlow is a production-ready full-stack web application that extracts transactions from bank statement PDFs and writes them into existing Excel cashbook templates non-destructively. The application uses AI-powered automation to save hours of manual data entry while maintaining accuracy and data integrity.

## Tech Stack

- **Framework**: TanStack Start v1 (React 19, file-based routing, createServerFn for backend logic)
- **Build Tool**: Vite 7
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with @theme tokens (no tailwind.config.js)
- **UI Components**: shadcn/ui components
- **Database**: Supabase (PostgreSQL + Auth + Storage with private buckets)
- **Excel Processing**: SheetJS (xlsx) for all Excel read/write operations
- **AI Extraction**: OpenAI-compatible gateway using google/gemini-2.5-flash
- **Charts**: Recharts for data visualization
- **Testing**: Vitest for unit tests

## Key Features

### AI-Powered Extraction
- Automatic extraction of transactions from PDF bank statements
- Smart categorization using merchant mappings, keyword rules, and AI fallback
- Confidence scoring for each categorization

### Template Analysis
- Automatic detection of cashbook layout types:
  - Single ledger (debit + credit + category columns)
  - Single columnar block (one column per category)
  - Two-sided cashbook (Receipts/Payments blocks with independent cursors)
- Header concatenation for multi-row headers
- Auto-discovery of category names

### Non-Destructive Export
- Append-only approach that preserves existing template data
- Independent row cursors for two-sided layouts
- Maintains formulas, formatting, and cell structure

### Authentication
- Email/password authentication
- Google OAuth integration
- Password reset functionality
- Protected routes with middleware

### Security
- Row-Level Security (RLS) on all database tables
- User-isolated storage buckets
- Explicit GRANTs on all public tables
- SECURITY DEFINER function for role-based access control

## Project Structure

```
statementflow/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout.tsx   # Main layout with sidebar
│   │   └── sidebar.tsx   # Navigation sidebar
│   ├── lib/
│   │   ├── auth.ts       # Authentication functions
│   │   ├── server-functions.ts  # Server-side functions
│   │   ├── supabase.ts   # Supabase client
│   │   └── utils.ts      # Utility functions
│   ├── routes/
│   │   ├── index.tsx      # Landing page
│   │   ├── auth.tsx       # Authentication page
│   │   ├── auth.callback.tsx  # OAuth callback
│   │   ├── reset-password.tsx  # Password reset
│   │   ├── authenticated.tsx   # Protected layout
│   │   ├── authenticated.dashboard.tsx
│   │   ├── authenticated.statements.tsx
│   │   ├── authenticated.transactions.tsx
│   │   ├── authenticated.categories.tsx
│   │   ├── authenticated.rules.tsx
│   │   ├── authenticated.templates.tsx
│   │   ├── authenticated.exports.tsx
│   │   ├── authenticated.reports.tsx
│   │   ├── authenticated.audit-log.tsx
│   │   ├── authenticated.settings.tsx
│   │   └── authenticated.about.tsx
│   ├── styles.css        # Tailwind CSS v4 with semantic tokens
│   └── test/
│       ├── excel-export.test.ts  # Excel export validation tests
│       └── setup.ts
├── supabase/
│   ├── schema.sql       # Database schema with RLS policies
│   ├── storage.sql      # Storage bucket configuration
│   └── seed-categories.sql  # Zimbabwe-oriented default categories
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── .env.example         # Environment variables template
```

## Database Schema

### Main Tables
- **profiles**: User profile information (1:1 with auth user)
- **user_roles**: Role-based access control (separate from profiles)
- **bank_statements**: Uploaded bank statement metadata
- **transactions**: Extracted transaction data
- **categories**: Custom transaction categories
- **merchant_mappings**: Merchant to category mappings
- **rules**: Keyword/regex to category rules
- **templates**: Excel template metadata and field mappings
- **exports**: Export history and metadata
- **audit_logs**: Activity tracking

### Storage Buckets
- **statements**: Private bucket for PDF bank statements (15 MB limit)
- **templates**: Private bucket for Excel templates (10 MB limit)
- **exports**: Private bucket for generated exports (50 MB limit)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AI_GATEWAY_URL=your_ai_gateway_url
   VITE_AI_API_KEY=your_ai_api_key
   VITE_APP_URL=http://localhost:3000
   ```

3. Set up Supabase:
   - Create a new project in Supabase
   - Run the SQL scripts in the `supabase/` directory in order:
     - `schema.sql`
     - `storage.sql`
   - Configure Google OAuth in Supabase Auth settings
   - Enable Google provider with your client ID and secret

## Development

### Install dependencies
```bash
npm install
```

### Generate routes
```bash
npm run generate-routes
```

### Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Run tests
```bash
npm test
```

### Build for production
```bash
npm run build
```

## Deployment

The application is designed for edge worker deployment and should:
- Not use child_process, sharp, canvas, or native modules
- Use environment variables for configuration
- Be compatible with Vercel, Cloudflare Workers, or similar platforms

## Zimbabwe-Oriented Categories

The application includes a default category set tailored for Zimbabwe businesses:

### Debit Categories (Expenses)
- Compensation Employees
- Communication
- Educational Materials
- Utilities
- Computerisation
- Hospitality
- Fertilizers
- Transport
- Rent
- Insurance
- Office Supplies
- Professional Fees
- Maintenance Repairs
- Marketing Advertising
- Bank Charges
- Other Expenses

### Credit Categories (Income)
- Sale of Services
- Grants & Donations
- Other Income
- Interest Income
- Sales Revenue
- Consulting Fees
- Rental Income
- Dividend Income

### Both Categories
- Transfers
- Adjustments
- Foreign Exchange
- Tax

## Server Functions

All server functions are implemented as TanStack Start server functions with auth middleware and Zod validation:

- `parseStatement`: Extract transactions from PDF using AI
- `analyzeTemplate`: Analyze Excel template structure using AI
- `exportCashbook`: Generate Excel export with non-destructive write
- `previewExport`: Preview export before download
- `updateTransactionCategory`: Update transaction category
- `updateTransactionDescription`: Update transaction description
- `saveMatchingRule`: Create merchant mapping and keyword rule
- `applyAllRules: Re-run all categorization rules in bulk

## Quality Assurance

- ✅ Vitest test suite for Excel export validation
- ✅ Type-checking with TypeScript
- ✅ Production build completed successfully
- ✅ No useEffect data fetching (uses useEffect for component mounting)
- ✅ All routes have SEO meta tags
- ✅ Semantic CSS tokens (no hardcoded colors)
- ✅ Comprehensive error handling
- ✅ Security best practices (RLS, user isolation)

## Branding

- **Name**: StatementFlow
- **By**: NEHANDA Technical
- **Tagline**: Smart Bank Statement to Cashbook Automation
- **Colors**: Black sidebar, green accent, white surfaces
- **Footer**: "Developed by NEHANDA Technical©"

## License

All rights reserved to NEHANDA Technical.

## Support

For support or questions, please contact the development team.