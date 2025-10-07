'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
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
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
      setSuccess(`Group "${newGroup.name}" created successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError('Failed to create group')
    }
  }

  const [joinId, setJoinId] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  
  const handleJoin = async () => {
    if (!user || !joinId.trim()) return
    setError('')
    setJoinLoading(true)
    
    try {
      const { data: result, error } = await supabase
        .rpc('join_group_by_id', {
          group_uuid: joinId.trim(),
          user_uuid: user.id
        })
      
      if (error) {
        setError(error.message)
        return
      }
      
      if (!result.success) {
        setError(result.error)
        return
      }
      
      // Add the group to the local state
      setGroups(g => [result.group as Group, ...g])
      setJoinId('')
      setSuccess(`Successfully joined group: ${result.group.name}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError('Failed to join group')
    } finally {
      setJoinLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Groups</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Create or join a shared budget group.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <Button onClick={handleJoin} disabled={!joinId.trim() || joinLoading}>
                  {joinLoading ? 'Joining...' : 'Join'}
                </Button>
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
                      <div key={g.id} className="p-3 border rounded hover:bg-accent">
                        <Link href={`/groups/${g.id}`} className="block">
                          <div className="font-medium">{g.name}</div>
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-muted-foreground truncate flex-1 mr-2">ID: {g.id}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(g.id)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            {copiedId === g.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {error && <div className="text-destructive text-sm mt-3">{error}</div>}
                {success && <div className="text-green-600 text-sm mt-3">{success}</div>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
