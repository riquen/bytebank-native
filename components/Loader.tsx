import { ActivityIndicator, View } from 'react-native'

type LoaderProps = {
  size?: 'small' | 'large'
  color?: 'background' | 'foreground'
}

export const Loader = ({
  size = 'large',
  color = 'foreground',
}: LoaderProps) => {
  const colorMap = { foreground: '#004D61', background: '#E4EDE3' } as const
  return (
    <View className="items-center justify-center">
      <ActivityIndicator size={size} color={colorMap[color]} />
    </View>
  )
}
