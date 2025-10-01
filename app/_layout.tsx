import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { Stack } from 'expo-router'
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen'
import { useEffect } from 'react'
import ToastManager from 'toastify-react-native'
import { StatusBar } from 'expo-status-bar'

import '../styles/global.css'

preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_700Bold })

  useEffect(() => {
    if (loaded || error) hideAsync()
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#E4EDE3' },
        }}
      />
      <ToastManager />
    </>
  )
}
