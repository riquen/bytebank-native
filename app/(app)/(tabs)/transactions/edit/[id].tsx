import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, Alert, FlatList } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Toast } from 'toastify-react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '@/utils/supabase'
import {
  uploadTransactionFile,
  deleteTransactionFile,
  deleteAllTransactionFiles,
  filenameFromPath,
  type PickedAsset,
} from '@/utils/storage'
import { Loader } from '@/components/Loader'

type TxKind = { code: string; label: string; direction: 'inflow' | 'outflow' }
type TxFile = {
  id: string
  path: string
  content_type: string
  created_at: string
}

function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${(Math.round(n * 100) / 100).toFixed(2).replace('.', ',')}`
  }
}

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kinds, setKinds] = useState<TxKind[]>([])
  const [selectedKind, setSelectedKind] = useState<string>('')
  const [amountStr, setAmountStr] = useState('')

  const [files, setFiles] = useState<TxFile[]>([])

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

  const reloadFiles = async () => {
    const { data, error } = await supabase
      .from('transaction_files')
      .select('id, path, content_type, created_at')
      .eq('transaction_id', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    setFiles((data ?? []) as TxFile[])
  }

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

        const { data: kindsData, error: kErr } = await supabase
          .from('transaction_kinds')
          .select('code,label,direction')
        if (kErr) throw kErr
        const ks = (kindsData ?? []) as TxKind[]
        setKinds(ks)

        const { data: tx, error } = await supabase
          .from('transactions')
          .select('transaction_id, amount, transaction_type')
          .eq('transaction_id', id)
          .maybeSingle()
        if (error) throw error
        if (!tx) {
          Toast.error('Transação não encontrada')
          router.back()
          return
        }

        setSelectedKind(tx.transaction_type)
        setAmountStr(String(tx.amount).replace('.', ','))

        await reloadFiles()
      } catch (e) {
        console.error(e)
        Toast.error('Erro ao carregar transação')
        router.back()
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const selectedMeta = kinds.find((k) => k.code === selectedKind)
  const canSubmit =
    selectedKind &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !submitting

  const handleSave = async () => {
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('transactions')
        .update({ amount: parsedAmount, transaction_type: selectedKind })
        .eq('transaction_id', id)
      if (error) throw error
      Toast.success('Transação atualizada')
      router.replace('/(app)/(tabs)/transactions')
    } catch (e) {
      console.error(e)
      Toast.error('Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTx = async () => {
    Alert.alert('Excluir', 'Deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true)

            await deleteAllTransactionFiles(id)

            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('transaction_id', id)
            if (error) throw error

            Toast.success('Transação excluída')
            router.replace('/(app)/(tabs)/transactions')
          } catch (e) {
            console.error(e)
            Toast.error('Erro ao excluir')
          } finally {
            setSubmitting(false)
          }
        },
      },
    ])
  }

  const pickAndUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png'],
        multiple: false,
        copyToCacheDirectory: true,
      })
      if (res.canceled) return
      const asset = res.assets?.[0]
      if (!asset) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const uid = user?.id ?? ''
      await uploadTransactionFile({
        userId: uid,
        transactionId: id,
        asset: {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
        } as PickedAsset,
      })
      await reloadFiles()
      Toast.success('Anexo adicionado')
    } catch (e) {
      console.error(e)
      Toast.error('Falha ao enviar anexo')
    }
  }

  const removeFile = async (file: TxFile) => {
    Alert.alert(
      'Remover anexo',
      `Deseja remover ${filenameFromPath(file.path)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransactionFile({
                transactionId: id,
                path: file.path,
              })
              await reloadFiles()
              Toast.success('Anexo removido')
            } catch (e) {
              console.error(e)
              Toast.error('Falha ao remover anexo')
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <View className="flex-1 px-6 py-4 gap-10">
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

      <View className="gap-2">
        <Text className="text-sm text-black/70">Anexos</Text>

        <Pressable
          onPress={pickAndUpload}
          className="flex-row items-center gap-2 bg-white border border-black/10 rounded-xl px-3 py-3 active:opacity-80"
        >
          <Ionicons name="attach-outline" size={18} color="#004D61" />
          <Text className="text-[#004D61] font-semibold">
            Adicionar anexo (PDF/PNG)
          </Text>
        </Pressable>

        <FlatList
          data={files}
          keyExtractor={(f) => f.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between bg-white border border-black/10 rounded-xl px-3 py-3 mt-2">
              <View className="flex-row items-center gap-8">
                <Ionicons
                  name={
                    item.content_type === 'application/pdf'
                      ? 'document-text-outline'
                      : 'image-outline'
                  }
                  size={18}
                  color="#004D61"
                />
                <Text className="text-black">
                  {filenameFromPath(item.path)}
                </Text>
              </View>
              <Pressable
                onPress={() => removeFile(item)}
                className="px-2 py-1 rounded-md active:opacity-70"
              >
                <Text className="text-red-600 font-semibold">Remover</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-black/50 mt-2">Nenhum anexo</Text>
          }
        />
      </View>

      <View className="gap-3">
        <Pressable
          disabled={!canSubmit}
          onPress={handleSave}
          className={`py-3 rounded-xl items-center justify-center ${canSubmit ? 'bg-[#004D61]' : 'bg-[#004D61]/40'}`}
        >
          <Text className="text-white font-semibold">Salvar alterações</Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteTx}
          className="py-3 rounded-xl items-center justify-center bg-red-600 active:opacity-80"
        >
          <Text className="text-white font-semibold">Excluir</Text>
        </Pressable>
      </View>
    </View>
  )
}
