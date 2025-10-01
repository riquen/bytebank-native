import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native'
import { Toast } from 'toastify-react-native'
import { router } from 'expo-router'
import { supabase } from '@/utils/supabase'
import { Loader } from '@/components/Loader'
import { TransactionsPie } from '@/components/TransactionsPie'

type TxKind = { code: string; label: string; direction: 'inflow' | 'outflow' }
type Tx = {
  transaction_id: string
  created_at: string
  amount: number
  transaction_type: string
  kind?: TxKind
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${(Math.round(n * 100) / 100).toFixed(2).replace('.', ',')}`
  }
}

export default function AppHome() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [kinds, setKinds] = useState<Record<string, TxKind>>({})
  const [txsList, setTxsList] = useState<Tx[]>([])
  const [txs30d, setTxs30d] = useState<Tx[]>([])

  const loadAll = useCallback(async () => {
    try {
      setRefreshing(true)
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? null
      setUserId(uid)
      if (!uid) {
        setTxsList([])
        setTxs30d([])
        return
      }

      const { data: kindsData, error: kErr } = await supabase
        .from('transaction_kinds')
        .select('code,label,direction')
      if (kErr) throw kErr
      const map: Record<string, TxKind> = {}
      ;(kindsData ?? []).forEach((k) => {
        map[k.code] = k as TxKind
      })
      setKinds(map)

      const fromISO = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString()

      const [qList, q30] = await Promise.all([
        supabase
          .from('transactions')
          .select('transaction_id,created_at,amount,transaction_type')
          .eq('profile_id', uid)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('transactions')
          .select('transaction_id,created_at,amount,transaction_type')
          .eq('profile_id', uid)
          .gte('created_at', fromISO)
          .order('created_at', { ascending: false }),
      ])
      if (qList.error) throw qList.error
      if (q30.error) throw q30.error

      setTxsList(
        (qList.data ?? []).map((t) => ({
          ...t,
          kind: map[t.transaction_type],
        })),
      )
      setTxs30d(
        (q30.data ?? []).map((t) => ({ ...t, kind: map[t.transaction_type] })),
      )
    } catch (e) {
      console.error(e)
      Toast.error('Erro ao carregar dados')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel('home')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${userId}`,
        },
        () => loadAll(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, loadAll])

  const onRefresh = useCallback(() => {
    loadAll()
  }, [loadAll])

  const renderItem = useCallback(({ item }: { item: Tx }) => {
    const isOut = item.kind?.direction === 'outflow'
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/transactions/edit/[id]',
            params: { id: item.transaction_id },
          })
        }
        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
        style={({ pressed }) => [
          { backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent' },
        ]}
        className="flex-row items-center justify-between px-6 py-3 border-b border-black/10"
        accessibilityRole="button"
      >
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-black">
            {item.kind?.label ?? item.transaction_type}
          </Text>
          <Text className="text-xs text-black/60">
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Text
          className={`text-base font-bold ${isOut ? 'text-red-600' : 'text-green-700'}`}
        >
          {formatBRL(item.amount)}
        </Text>
      </Pressable>
    )
  }, [])

  const keyExtractor = useCallback((i: Tx) => i.transaction_id, [])

  const listHeader = useMemo(
    () => (
      <View className="px-6 pt-2">
        <View
          className="bg-white rounded-2xl border border-black/10 p-3"
          accessibilityLabel="Resumo de entradas e saídas dos últimos 30 dias"
        >
          <View className="flex-row items-center justify-between px-1 mb-2">
            <Text className="text-base font-semibold text-black">Resumo</Text>
            <View className="px-2 py-1 rounded-full bg-black/5">
              <Text className="text-[11px] text-black/70">Últimos 30 dias</Text>
            </View>
          </View>
          <View className="items-center">
            <TransactionsPie
              txs={txs30d}
              kinds={kinds}
              groupBy="direction"
              size={210}
              coverRadius={0.65}
              coverFill="#ffffff"
              showLegend
            />
          </View>
        </View>
      </View>
    ),
    [txs30d, kinds],
  )

  if (loading) {
    return <Loader />
  }

  return (
    <View className="flex-1">
      <FlatList
        data={txsList}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-black/60">Nenhuma transação ainda</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  )
}
