import * as React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
        <footer className="border-t border-border py-6 px-8 text-center text-sm text-text-muted">
          Developed by NEHANDA Technical©
        </footer>
      </main>
    </div>
  )
}