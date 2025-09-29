import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Redirect } from 'expo-router'
import { View, Text } from 'react-native'
import { Loader } from '@/components/Loader'

export default function Home() {
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

  if (!authed) return <Redirect href="/(auth)" />

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-6xl text-red-500">Welcome</Text>
      <Text className="text-6xl font-inter-regular text-red-500">Home!</Text>
      <Text className="text-6xl font-bold text-green-500">Welcome</Text>
      <Text className="text-6xl font-inter-bold text-green-500">Home!</Text>
    </View>
  )
}
