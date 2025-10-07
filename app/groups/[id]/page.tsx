'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Group, GroupExpense, GroupMember } from '@/types/database'
import { formatINR } from '@/lib/utils'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = (params?.id as string) || ''
  const { user } = useAuth()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add expense state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!user || !groupId) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [{ data: g }, { data: ms }, { data: es }] = await Promise.all([
          supabase.from('groups').select('*').eq('id', groupId).single(),
          supabase.from('group_members').select('*').eq('group_id', groupId),
          supabase.from('group_expenses').select('*').eq('group_id', groupId).order('date', { ascending: false })
        ])
        setGroup(g as Group)
        setMembers(Array.isArray(ms) ? ms as GroupMember[] : [])
        setExpenses(Array.isArray(es) ? es as GroupExpense[] : [])
      } catch (e) {
        setError('Failed to load group')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, groupId])

  const balances = useMemo(() => {
    // compute net: paid - owed
    const memberIds = members.map(m => m.user_id)
    const net: Record<string, number> = {}
    memberIds.forEach(id => (net[id] = 0))

    // paid
    expenses.forEach(ex => { net[ex.payer_id] = (net[ex.payer_id] || 0) + Number(ex.amount) })
    // owed shares
    // For simplicity here, recompute equal shares on the fly; in production read group_expense_shares
    expenses.forEach(ex => {
      const share = memberIds.length > 0 ? Number(ex.amount) / memberIds.length : 0
      memberIds.forEach(id => { net[id] = (net[id] || 0) - share })
    })
    return net
  }, [members, expenses])

  const handleAddExpense = async () => {
    if (!user || !groupId) return
    const amt = Number(amount)
    if (!description.trim() || !amt || amt <= 0) return
    setError('')
    // Insert expense
    const { data: exp, error } = await supabase.from('group_expenses').insert([
      {
        group_id: groupId,
        payer_id: user.id,
        description: description.trim(),
        amount: amt,
        split_type: 'equal'
      }
    ]).select('*').single()
    if (error) { setError(error.message); return }

    // Resolve equal shares for all current members
    const share = members.length > 0 ? amt / members.length : 0
    const shares = members.map(m => ({ expense_id: (exp as GroupExpense).id, member_id: m.user_id, share_amount: share }))
    await supabase.from('group_expense_shares').insert(shares)

    setDescription('')
    setAmount('')
    setExpenses(es => [exp as GroupExpense, ...es])
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : !group ? (
            <div className="text-destructive">Group not found.</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">{group.name}</h1>
                <div className="text-xs text-muted-foreground">Group ID: {group.id}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>People in this group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {members.map(m => (
                        <div key={m.user_id} className="flex items-center justify-between">
                          <span>{m.user_id}</span>
                          <span className="text-muted-foreground capitalize">{m.role}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Balances</CardTitle>
                    <CardDescription>Positive means others owe them</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {members.map(m => (
                        <div key={m.user_id} className="flex items-center justify-between">
                          <span>{m.user_id}</span>
                          <span className={balances[m.user_id] >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatINR(balances[m.user_id] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Add Shared Expense</CardTitle>
                  <CardDescription>Equal split across all current members</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Groceries" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="amt">Amount (₹)</Label>
                    <Input id="amt" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 1500" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={handleAddExpense}>Add</Button>
                  </div>
                  {error && <div className="text-destructive text-sm sm:col-span-3">{error}</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Group Expenses</CardTitle>
                  <CardDescription>Latest first</CardDescription>
                </CardHeader>
                <CardContent>
                  {expenses.length === 0 ? (
                    <div className="text-muted-foreground">No expenses yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map(ex => (
                        <div key={ex.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{ex.description || 'Untitled'}</div>
                            <div className="text-xs text-muted-foreground">Paid by {ex.payer_id} on {new Date(ex.date).toLocaleDateString()}</div>
                          </div>
                          <div className="font-semibold">{formatINR(Number(ex.amount))}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
