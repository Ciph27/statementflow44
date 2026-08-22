import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { LayoutDashboard, FileText, CreditCard, Tag, Sparkles, FileSpreadsheet, BarChart3, Download, ClipboardList, Settings, Info, LogOut, Menu, X } from "lucide-react"
import { cn } from "../lib/utils"
import { signOut } from "../lib/auth"

const navigation = [
  { name: "Dashboard", href: "/authenticated/dashboard", icon: LayoutDashboard },
  { name: "Statements", href: "/authenticated/statements", icon: FileText },
  { name: "Transactions", href: "/authenticated/transactions", icon: CreditCard },
  { name: "Categories", href: "/authenticated/categories", icon: Tag },
  { name: "Rules Engine", href: "/authenticated/rules", icon: Sparkles },
  { name: "Templates", href: "/authenticated/templates", icon: FileSpreadsheet },
  { name: "Reports", href: "/authenticated/reports", icon: BarChart3 },
  { name: "Exports", href: "/authenticated/exports", icon: Download },
  { name: "Audit Log", href: "/audit-log", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "About", href: "/about", icon: Info },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const navigate = useNavigate()
  const currentPath = window.location.pathname

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth")
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar-bg text-sidebar-text"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-sidebar-bg text-sidebar-text z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold">StatementFlow</h1>
            <p className="text-xs text-sidebar-text opacity-70 mt-1">
              by NEHANDA Technical
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = currentPath === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-white"
                          : "text-sidebar-text hover:bg-sidebar-border hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-text hover:bg-sidebar-border hover:text-white transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}