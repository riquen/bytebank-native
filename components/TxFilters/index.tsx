import { useMemo } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'

export type Direction = 'all' | 'inflow' | 'outflow'
export type Period = 'all' | '30d' | '7d' | 'today'

export type TxKind = {
  code: string
  label: string
  direction: 'inflow' | 'outflow'
}

export type Filters = {
  direction: Direction
  kind: string | 'all'
  period: Period
}

type Props = {
  kinds: TxKind[]
  value: Filters
  onChange: (next: Filters) => void
}

const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
}) => (
  <Pressable
    onPress={onPress}
    className={`px-3 py-2 rounded-full border mr-2 mb-2 ${
      selected ? 'bg-[#004D61] border-[#004D61]' : 'bg-white border-black/20'
    }`}
    android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
  >
    <Text className={`${selected ? 'text-white' : 'text-black'}`}>{label}</Text>
  </Pressable>
)

export const TxFilters = ({ kinds, value, onChange }: Props) => {
  const kindsByDirection = useMemo(() => {
    const inKinds = kinds.filter((k) => k.direction === 'inflow')
    const outKinds = kinds.filter((k) => k.direction === 'outflow')
    return { inKinds, outKinds }
  }, [kinds])

  return (
    <View className="px-6 py-3">
      <Text className="text-xs text-black/60 mb-2">Direção</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 6 }}
      >
        <Chip
          label="Todos"
          selected={value.direction === 'all'}
          onPress={() => onChange({ ...value, direction: 'all', kind: 'all' })}
        />
        <Chip
          label="Entradas"
          selected={value.direction === 'inflow'}
          onPress={() =>
            onChange({
              ...value,
              direction: 'inflow',
              kind:
                value.kind !== 'all' &&
                kinds.find((k) => k.code === value.kind)?.direction !== 'inflow'
                  ? 'all'
                  : value.kind,
            })
          }
        />
        <Chip
          label="Saídas"
          selected={value.direction === 'outflow'}
          onPress={() =>
            onChange({
              ...value,
              direction: 'outflow',
              kind:
                value.kind !== 'all' &&
                kinds.find((k) => k.code === value.kind)?.direction !==
                  'outflow'
                  ? 'all'
                  : value.kind,
            })
          }
        />
      </ScrollView>

      <Text className="text-xs text-black/60 mt-2 mb-2">Tipo</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 6 }}
      >
        <Chip
          label="Todos"
          selected={value.kind === 'all'}
          onPress={() => onChange({ ...value, kind: 'all' })}
        />
        {(value.direction === 'inflow'
          ? kindsByDirection.inKinds
          : value.direction === 'outflow'
            ? kindsByDirection.outKinds
            : kinds
        ).map((k) => (
          <Chip
            key={k.code}
            label={k.label}
            selected={value.kind === k.code}
            onPress={() => onChange({ ...value, kind: k.code })}
          />
        ))}
      </ScrollView>

      <Text className="text-xs text-black/60 mt-2 mb-2">Período</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 6 }}
      >
        <Chip
          label="Tudo"
          selected={value.period === 'all'}
          onPress={() => onChange({ ...value, period: 'all' })}
        />
        <Chip
          label="30 dias"
          selected={value.period === '30d'}
          onPress={() => onChange({ ...value, period: '30d' })}
        />
        <Chip
          label="7 dias"
          selected={value.period === '7d'}
          onPress={() => onChange({ ...value, period: '7d' })}
        />
        <Chip
          label="Hoje"
          selected={value.period === 'today'}
          onPress={() => onChange({ ...value, period: 'today' })}
        />
      </ScrollView>
    </View>
  )
}
