import { useEffect, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/utils/supabase'
import { Toast } from 'toastify-react-native'
import { Ionicons } from '@expo/vector-icons'
import Logo from '@/assets/svgs/icon.svg'

type Props = {
  name?: string
  balance?: number
}

function formatBRL(value: number | undefined) {
  if (typeof value !== 'number') return 'R$ 0,00'
  try {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    const s = (Math.round(value * 100) / 100).toFixed(2).replace('.', ',')
    return `R$ ${s}`
  }
}

export default function Header({
  name: nameProp,
  balance: balanceProp,
}: Props) {
  const [name, setName] = useState(nameProp)
  const [balance, setBalance] = useState(balanceProp)

  useEffect(() => {
    let uid: string | undefined

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      uid = user?.id ?? undefined
      if (!uid) return
      if (nameProp === undefined || balanceProp === undefined) {
        const { data } = await supabase
          .from('profiles')
          .select('name, balance')
          .eq('id', uid)
          .maybeSingle()
        if (data) {
          setName(data.name)
          setBalance(data.balance)
        }
      }
    }
    bootstrap()

    const ch = supabase
      .channel('header')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const next = payload.new as {
            id?: string
            balance?: number
            name?: string
          }
          if (uid && next?.id === uid) {
            if (next.balance !== undefined) setBalance(next.balance)
            if (next.name !== undefined) setName(next.name)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [nameProp, balanceProp])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    Toast.success('Você saiu da conta')
    router.replace('/(auth)')
  }

  return (
    <View className="w-full pt-6 pb-3 px-6 bg-[#E4EDE3]">
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

      <View className="mt-3">
        <Text className="text-base text-black/70">
          Olá{name ? `, ${name}` : ''}
        </Text>
        <Text className="text-2xl font-bold text-black">
          {formatBRL(balance)}
        </Text>
      </View>
    </View>
  )
}
