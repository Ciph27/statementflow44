import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles.css'
import Layout from './components/layout'
import Sidebar from './components/sidebar'
import LandingPage from './routes/index'
import AuthPage from './routes/auth'
import AuthCallback from './routes/auth.callback'
import ResetPassword from './routes/reset-password'
import Dashboard from './routes/authenticated.dashboard'
import Statements from './routes/authenticated.statements'
import Transactions from './routes/authenticated.transactions'
import Categories from './routes/authenticated.categories'
import Rules from './routes/authenticated.rules'
import Templates from './routes/authenticated.templates'
import Exports from './routes/authenticated.exports'
import Reports from './routes/authenticated.reports'
import AuditLog from './routes/authenticated.audit-log'
import Settings from './routes/authenticated.settings'
import About from './routes/authenticated.about'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with layout */}
          <Route
            path="/authenticated/*"
            element={
              <Layout>
                <Sidebar />
              </Layout>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="statements" element={<Statements />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="rules" element={<Rules />} />
            <Route path="templates" element={<Templates />} />
            <Route path="exports" element={<Exports />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)