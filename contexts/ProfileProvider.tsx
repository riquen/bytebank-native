import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '@/utils/supabase'

type RawProfile = { id: string; name: string | null; balance: number | string }
type Profile = { id: string; name: string; balance: number }

type Ctx = {
  profile?: Profile
  loading: boolean
  refresh: () => Promise<void>
}

const ProfileContext = createContext<Ctx>({
  loading: true,
  refresh: async () => {},
})

function coerceProfile(p?: RawProfile | null): Profile | undefined {
  if (!p) return undefined
  const n =
    typeof p.balance === 'string'
      ? parseFloat(p.balance)
      : typeof p.balance === 'number'
        ? p.balance
        : NaN
  return {
    id: p.id,
    name: p.name ?? '',
    balance: Number.isFinite(n) ? n : 0,
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | undefined>()
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const uid = user?.id
    if (!uid) {
      setProfile(undefined)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,balance')
      .eq('id', uid)
      .maybeSingle()
    if (!error) setProfile(coerceProfile(data as RawProfile))
  }, [])

  useEffect(() => {
    let mounted = true
    const setup = async () => {
      try {
        setLoading(true)
        await refresh()

        const {
          data: { user },
        } = await supabase.auth.getUser()
        const uid = user?.id
        if (!uid) return

        const chan = supabase
          .channel('profile-live')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${uid}`,
            },
            (payload) => {
              if (!mounted) return
              const next = coerceProfile(payload.new as RawProfile)
              if (next) setProfile(next)
            },
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `profile_id=eq.${uid}`,
            },
            async () => {
              if (!mounted) return
              await refresh()
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(chan)
        }
      } finally {
        setLoading(false)
      }
    }

    let cleanup: (() => void) | undefined
    setup().then((c) => {
      cleanup = c as unknown as () => void
    })

    const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setProfile(undefined)
    })

    return () => {
      mounted = false
      cleanup?.()
      authSub.subscription.unsubscribe()
    }
  }, [refresh])

  const value = useMemo<Ctx>(
    () => ({ profile, loading, refresh }),
    [profile, loading, refresh],
  )

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
