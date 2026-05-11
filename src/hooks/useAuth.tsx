import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthCtx {
  user: User | null
  loading: boolean
  role: string | null
  displayName: string | null
  updateDisplayName: (name: string) => Promise<void>
  signIn: (email: string, pass: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('display_name, role').eq('id', session.user.id).single()
        setDisplayName(data?.display_name ?? null)
        setRole(data?.role ?? null)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, pass: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw new Error(error.message)
  }

  async function updateDisplayName(name: string) {
  if (!user) return
  await supabase.from('profiles').upsert({ id: user.id, display_name: name })
  setDisplayName(name)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return <Ctx.Provider value={{ user, loading, role, displayName, signIn, signOut, updateDisplayName }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be inside AuthProvider')
  return c
}