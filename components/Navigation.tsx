'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { 
  LayoutDashboard, 
  PlusCircle, 
  Receipt, 
  Target, 
  Brain,
  LogOut,
  Menu,
  Users,
  Calculator
} from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navigation() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses/new', label: 'Add Expense', icon: PlusCircle },
    { href: '/expenses', label: 'View Expenses', icon: Receipt },
    { href: '/budget', label: 'Budget Planner', icon: Target },
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/simulator', label: 'What-If', icon: Calculator },
    { href: '/ai-insights', label: 'AI Insights', icon: Brain },
    { href: '/expenses/scan', label: 'Scan Receipt', icon: Receipt },
  ]

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              ExpenseTracker
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <button
                aria-label="Open menu"
                className="p-2 rounded hover:bg-accent focus:outline-none"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden flex flex-col space-y-2 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}