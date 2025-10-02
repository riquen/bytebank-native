import { Slot } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import { ProfileProvider } from '@/contexts/ProfileProvider'

const BG = '#E4EDE3'

export default function AppLayout() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BG }}
      edges={['top', 'bottom']}
    >
      <ProfileProvider>
        <Header />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </ProfileProvider>
    </SafeAreaView>
  )
}
