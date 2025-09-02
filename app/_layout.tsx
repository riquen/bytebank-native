import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { Stack } from 'expo-router'
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import '../styles/global.css'

preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_700Bold })

  useEffect(() => {
    if (loaded || error) hideAsync()
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  )
}
