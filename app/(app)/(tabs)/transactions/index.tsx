import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { Toast } from 'toastify-react-native'
import { supabase } from '@/utils/supabase'
import { Filters, TxFilters, TxKind } from '@/components/TxFilters'
import { Loader } from '@/components/Loader'

type Tx = {
  transaction_id: string
  created_at: string
  amount: number
  transaction_type: string
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

const PAGE_SIZE = 25

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [kinds, setKinds] = useState<TxKind[]>([])
  const kindsMap = useMemo(
    () => Object.fromEntries(kinds.map((k) => [k.code, k] as const)),
    [kinds],
  )
  const [items, setItems] = useState<Tx[]>([])
  const [filters, setFilters] = useState<Filters>({
    direction: 'all',
    kind: 'all',
    period: 'all',
  })
  const loadingRef = useRef(false)

  const dateFrom = useMemo(() => {
    const now = new Date()
    switch (filters.period) {
      case 'today':
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
        ).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return null
    }
  }, [filters.period])

  useEffect(() => {
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const uid = user?.id ?? null
        setUserId(uid)
        if (!uid) return

        const { data, error } = await supabase
          .from('transaction_kinds')
          .select('code,label,direction')
        if (error) throw error
        setKinds((data ?? []) as TxKind[])
      } catch (e) {
        console.error(e)
        Toast.error('Erro ao iniciar extrato')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const buildQuery = useCallback(
    (from: number, to: number) => {
      if (!userId) return null
      let q = supabase
        .from('transactions')
        .select('transaction_id,created_at,amount,transaction_type')
        .eq('profile_id', userId)

      if (dateFrom) q = q.gte('created_at', dateFrom)

      if (filters.kind !== 'all') {
        q = q.eq('transaction_type', filters.kind)
      } else if (filters.direction !== 'all') {
        const codes = kinds
          .filter((k) => k.direction === filters.direction)
          .map((k) => k.code)
        if (codes.length === 0) return { empty: true } as const
        q = q.in('transaction_type', codes)
      }

      return q.order('created_at', { ascending: false }).range(from, to)
    },
    [userId, dateFrom, filters.kind, filters.direction, kinds],
  )

  const fetchPage = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      try {
        if (reset) {
          setRefreshing(true)
          setHasMore(true)
        } else {
          setLoadingMore(true)
        }

        const offset = reset ? 0 : items.length
        const from = offset
        const to = offset + PAGE_SIZE - 1

        const q = buildQuery(from, to)
        if (!q) return
        if ('empty' in q) {
          if (reset) setItems([])
          setHasMore(false)
          return
        }

        const { data, error } = await q
        if (error) throw error
        const page = (data ?? []) as Tx[]
        if (reset) setItems(page)
        else setItems((prev) => [...prev, ...page])

        if (page.length < PAGE_SIZE) setHasMore(false)
      } catch (e) {
        console.error(e)
        Toast.error('Erro ao carregar extrato')
      } finally {
        loadingRef.current = false
        setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [items.length, buildQuery],
  )

  useEffect(() => {
    if (userId) fetchPage(true)
  }, [userId, filters, dateFrom])

  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel('transactions-screen')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${userId}`,
        },
        () => fetchPage(true),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, fetchPage])

  const onRefresh = useCallback(() => fetchPage(true), [fetchPage])

  const renderItem = useCallback(
    ({ item }: { item: Tx }) => {
      const kind = kindsMap[item.transaction_type]
      const isOut = kind?.direction === 'outflow'
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
              {kind?.label ?? item.transaction_type}
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
    },
    [kindsMap],
  )

  return (
    <View className="flex-1">
      <TxFilters kinds={kinds} value={filters} onChange={setFilters} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.transaction_id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-black/60">Nenhuma transação</Text>
          </View>
        }
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (!loadingMore && hasMore) fetchPage(false)
        }}
        ListFooterComponent={loadingMore ? <Loader /> : null}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  )
}
