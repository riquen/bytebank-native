import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Toast } from 'toastify-react-native'
import { supabase } from '@/utils/supabase'
import { Loader } from '@/components/Loader'

type TxKind = { code: string; label: string; direction: 'inflow' | 'outflow' }

function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${(Math.round(n * 100) / 100).toFixed(2).replace('.', ',')}`
  }
}

export default function NewTransactionScreen() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kinds, setKinds] = useState<TxKind[]>([])
  const [selectedKind, setSelectedKind] = useState<string>('')
  const [amountStr, setAmountStr] = useState('')

  const handleAmountChange = (raw: string) => {
    let t = raw.replace(/\./g, ',').replace(/[^0-9,]/g, '')
    const i = t.indexOf(',')
    if (i !== -1) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/,/g, '')
    if (t.startsWith(',')) t = '0' + t
    const parts = t.split(',')
    if (parts[1] !== undefined) {
      parts[1] = parts[1].slice(0, 2)
      t = parts.join(',')
    }
    setAmountStr(t)
  }

  const parsedAmount = useMemo(() => {
    if (!amountStr) return NaN
    const n = Number(amountStr.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
  }, [amountStr])

  useEffect(() => {
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const uid = user?.id
        if (!uid) {
          router.replace('/(auth)')
          return
        }

        const { data, error } = await supabase
          .from('transaction_kinds')
          .select('code,label,direction')
        if (error) throw error
        const ks = (data ?? []) as TxKind[]
        setKinds(ks)
        setSelectedKind(ks[0]?.code ?? '')
      } catch (e) {
        console.error(e)
        Toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const canSubmit =
    selectedKind &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const uid = user?.id
      if (!uid) {
        Toast.error('Sessão expirada')
        router.replace('/(auth)')
        return
      }
      const { error } = await supabase.from('transactions').insert({
        profile_id: uid,
        amount: parsedAmount,
        transaction_type: selectedKind,
      })
      if (error) throw error
      Toast.success('Transação criada')
      router.replace('/(app)/(tabs)/transactions')
    } catch (e) {
      console.error(e)
      Toast.error('Erro ao salvar transação')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  const selectedMeta = kinds.find((k) => k.code === selectedKind)

  return (
    <View className="flex-1 px-6 py-4 gap-16">
      <View>
        <Text className="text-sm text-black/70 mb-2">Tipo</Text>
        <View className="flex-row flex-wrap gap-2">
          {kinds.map((k) => {
            const selected = k.code === selectedKind
            return (
              <Pressable
                key={k.code}
                onPress={() => setSelectedKind(k.code)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-[#004D61] border-[#004D61]' : 'bg-white border-black/20'}`}
                style={{
                  shadowOpacity: selected ? 0.2 : 0,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                }}
              >
                <Text className={`${selected ? 'text-white' : 'text-black'}`}>
                  {k.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View>
        <Text className="text-sm text-black/70 mb-2">Valor</Text>
        <TextInput
          value={amountStr}
          onChangeText={handleAmountChange}
          placeholder="0,00"
          keyboardType="decimal-pad"
          inputMode="decimal"
          className="px-3 py-3 rounded-xl bg-white border border-black/20 text-black"
        />
        {Number.isFinite(parsedAmount) && parsedAmount > 0 && (
          <Text className="text-xs text-black/50 mt-1">
            {selectedMeta?.direction === 'outflow' ? 'Saída' : 'Entrada'} ·{' '}
            {formatBRL(parsedAmount)}
          </Text>
        )}
      </View>

      <View className="gap-3">
        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          className={`py-3 rounded-xl items-center justify-center ${canSubmit ? 'bg-[#004D61]' : 'bg-[#004D61]/40'}`}
        >
          <Text className="text-white font-semibold">Criar transação</Text>
        </Pressable>
      </View>
    </View>
  )
}
