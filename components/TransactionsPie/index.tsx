import React, { useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import PieChart from 'react-native-pie-chart'

type Direction = 'inflow' | 'outflow'

type TxKind = {
  code: string
  label: string
  direction: Direction
}

type Tx = {
  transaction_id?: string
  amount: number
  transaction_type: string
}

type Props = {
  txs: Tx[]
  kinds: Record<string, TxKind>
  groupBy?: 'direction' | 'kind'
  size?: number
  coverRadius?: number
  coverFill?: string
  showLegend?: boolean
}

const IN_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac']
const OUT_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5']

function toBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${(Math.round(n * 100) / 100).toFixed(2).replace('.', ',')}`
  }
}
function pct(v: number, total: number) {
  if (!total) return 0
  return Math.round((v / total) * 100)
}

export const TransactionsPie = ({
  txs,
  kinds,
  groupBy = 'direction',
  size = 220,
  coverRadius = 0.65,
  coverFill = '#ffffff',
  showLegend = true,
}: Props) => {
  const { slices, legend } = useMemo(() => {
    const empty = {
      slices: [{ value: 1, color: '#e5e7eb' }] as Array<{
        value: number
        color: string
      }>,
      legend: [{ label: 'Sem dados', color: '#e5e7eb', value: 0, percent: 0 }],
    }

    if (groupBy === 'direction') {
      let inSum = 0,
        outSum = 0
      for (const t of txs) {
        const k = kinds[t.transaction_type]
        if (!k) continue
        if (k.direction === 'outflow') outSum += t.amount
        else inSum += t.amount
      }
      const total = inSum + outSum
      if (total === 0) return empty

      const slices = [
        ...(inSum > 0 ? [{ value: inSum, color: IN_COLORS[0] }] : []),
        ...(outSum > 0 ? [{ value: outSum, color: OUT_COLORS[0] }] : []),
      ]

      const legend = [
        {
          label: 'Entradas',
          color: IN_COLORS[0],
          value: inSum,
          percent: pct(inSum, total),
        },
        {
          label: 'Saídas',
          color: OUT_COLORS[0],
          value: outSum,
          percent: pct(outSum, total),
        },
      ].filter((i) => i.value > 0)

      return { slices, legend }
    }

    const acc = new Map<
      string,
      { label: string; color: string; value: number }
    >()
    let iIn = 0,
      iOut = 0,
      total = 0

    for (const t of txs) {
      const k = kinds[t.transaction_type]
      if (!k) continue
      total += t.amount
      const key = k.code
      const cur = acc.get(key)
      if (cur) {
        cur.value += t.amount
      } else {
        const palette = k.direction === 'outflow' ? OUT_COLORS : IN_COLORS
        const idx =
          k.direction === 'outflow'
            ? iOut++ % OUT_COLORS.length
            : iIn++ % IN_COLORS.length
        acc.set(key, { label: k.label, color: palette[idx], value: t.amount })
      }
    }

    if (total === 0) return empty

    const arr = Array.from(acc.values()).sort((a, b) => b.value - a.value)
    const slices = arr.map((i) => ({ value: i.value, color: i.color }))
    const legend = arr.map((i) => ({
      label: i.label,
      color: i.color,
      value: i.value,
      percent: pct(i.value, total),
    }))

    return { slices, legend }
  }, [txs, kinds, groupBy])

  const coverProp =
    coverRadius != null
      ? coverFill
        ? { radius: coverRadius, color: coverFill }
        : coverRadius
      : undefined

  return (
    <View className="items-center">
      <PieChart
        widthAndHeight={size}
        series={slices}
        cover={coverProp}
        padAngle={0.01}
      />

      {showLegend && (
        <FlatList
          data={legend}
          keyExtractor={(it, idx) => `${it.label}-${idx}`}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-2 my-1">
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: item.color,
                }}
              />
              <Text className="text-sm text-black">
                {item.label} · {item.percent}% · {toBRL(item.value)}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          style={{ width: '90%' }}
        />
      )}
    </View>
  )
}
