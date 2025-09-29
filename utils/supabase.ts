import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const url = 'https://lscjplnprvhvbxuvydla.supabase.co'
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzY2pwbG5wcnZodmJ4dXZ5ZGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTc2NzQsImV4cCI6MjA2Mzg3MzY3NH0.H_Hc3mjveRhDtI2MCAu-RjKJTLv7yV1_EiAWSRh3kzk'

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
