import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/utils/supabase'
import { Toast } from 'toastify-react-native'
import { Ionicons } from '@expo/vector-icons'
import Logo from '@/assets/svgs/icon.svg'
import { useProfile } from '@/contexts/ProfileProvider'

function formatBRL(value?: number | string) {
  const n =
    typeof value === 'string'
      ? parseFloat(value)
      : typeof value === 'number'
        ? value
        : NaN

  if (!Number.isFinite(n)) return 'R$ 0,00'
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    const s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')
    return `R$ ${s}`
  }
}

export default function Header() {
  const { profile } = useProfile()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    Toast.success('Você saiu da conta')
    router.replace('/(auth)')
  }

  return (
    <View className="w-full pt-10 pb-4 px-6 bg-[#E4EDE3]">
      <View className="flex-row items-center justify-between">
        <Logo width={48} height={48} />
        <Pressable
          onPress={handleSignOut}
          className="p-2 rounded-full active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Sair"
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={22} />
        </Pressable>
      </View>

      <View className="mt-4">
        <Text className="text-base text-black/70">
          Olá{profile?.name ? `, ${profile.name}` : ''}
        </Text>
        <Text className="text-3xl font-bold text-black">
          {formatBRL(profile?.balance)}
        </Text>
      </View>
    </View>
  )
}
