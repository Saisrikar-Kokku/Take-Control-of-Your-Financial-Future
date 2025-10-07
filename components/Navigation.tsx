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
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-primary">
              ExpenseTracker
            </Link>
            <div className="hidden lg:flex ml-8 space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - Theme toggle and Sign out */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            {/* Mobile Hamburger */}
            <div className="lg:hidden ml-2">
              <button
                aria-label="Open menu"
                className="p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}