import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Redirect } from 'expo-router'
import { Loader } from '@/components/Loader'

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    const unsubscribe = () => subscription.unsubscribe()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  if (loading) return <Loader />

  return <Redirect href={authed ? '/(app)/(tabs)' : '/(auth)'} />
}
