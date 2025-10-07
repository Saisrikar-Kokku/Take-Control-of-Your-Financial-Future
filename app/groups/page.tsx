'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Group } from '@/types/database'
import Link from 'next/link'

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name, created_at, created_by')
          .in('id',
            (await supabase.from('group_members').select('group_id').eq('user_id', user.id)).data?.map(r => r.group_id) || []
          )
          .order('created_at', { ascending: false })
        if (error) setError(error.message)
        setGroups(Array.isArray(data) ? data : [])
      } catch (e) {
        setError('Failed to load groups')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleCreate = async () => {
    if (!user || !name.trim()) return
    setError('')
    try {
      // Use the database function to create group and add member atomically
      const { data: newGroupId, error } = await supabase
        .rpc('create_group_with_member', {
          group_name: name.trim(),
          creator_id: user.id
        })
      
      if (error) { 
        setError(error.message); 
        return 
      }
      
      // Fetch the created group details
      const { data: newGroup, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', newGroupId)
        .single()
      
      if (fetchError) {
        setError('Group created but failed to load details')
        return
      }
      
      setName('')
      setGroups(g => [newGroup as Group, ...g])
    } catch (e) {
      setError('Failed to create group')
    }
  }

  const [joinId, setJoinId] = useState('')
  const handleJoin = async () => {
    if (!user || !joinId.trim()) return
    setError('')
    const { data: group, error } = await supabase
      .from('groups')
      .select('id, name, created_at, created_by')
      .eq('id', joinId.trim())
      .single()
    if (error || !group) { setError('Group not found'); return }
    await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id, role: 'member' }])
    setGroups(g => [group as Group, ...g])
    setJoinId('')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="text-muted-foreground">Create or join a shared budget group.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>New Group</CardTitle>
                <CardDescription>Create a group for roommates, friends, or family.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="gname">Group name</Label>
                  <Input id="gname" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Flat 302 Roomies" />
                </div>
                <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
                <div className="pt-2 text-xs text-muted-foreground">After creating, share the Group ID with others to join.</div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Join Group</CardTitle>
                <CardDescription>Enter an existing Group ID to join.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="gid">Group ID</Label>
                  <Input id="gid" value={joinId} onChange={e => setJoinId(e.target.value)} placeholder="Paste Group ID" />
                </div>
                <Button onClick={handleJoin} disabled={!joinId.trim()}>Join</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Your Groups</CardTitle>
                <CardDescription>Open a group to add shared expenses.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : groups.length === 0 ? (
                  <div className="text-muted-foreground">You are not in any groups yet.</div>
                ) : (
                  <div className="space-y-2">
                    {groups.map(g => (
                      <Link key={g.id} href={`/groups/${g.id}`} className="block p-3 border rounded hover:bg-accent">
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {g.id}</div>
                      </Link>
                    ))}
                  </div>
                )}
                {error && <div className="text-destructive text-sm mt-3">{error}</div>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
