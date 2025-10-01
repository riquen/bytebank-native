import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const BG = '#E4EDE3'
const ACTIVE = '#004D61'
const INACTIVE = '#6B7280'

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: BG },

          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,

          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 0,
            lineHeight: 14,
          },

          tabBarItemStyle: {
            paddingVertical: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarStyle: {
            backgroundColor: BG,
            paddingTop: 4,
            paddingBottom: 8,
            height: 64,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderTopColor: 'rgba(0,0,0,0.08)',
            borderBottomColor: 'rgba(0,0,0,0.08)',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarLabel: 'Início',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Extrato',
            tabBarLabel: 'Extrato',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'list' : 'list-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="new/index"
          options={{
            title: 'Nova',
            tabBarLabel: 'Nova',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  )
}
