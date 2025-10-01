import { View } from 'react-native'
import { Slot } from 'expo-router'
import Header from '@/components/Header'
import { SafeAreaView } from 'react-native-safe-area-context'

const BG = '#E4EDE3'

export default function AppLayout() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BG }}
      edges={['top', 'bottom']}
    >
      <Header />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </SafeAreaView>
  )
}
