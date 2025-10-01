import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Toast } from 'toastify-react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/utils/supabase'
import { Loader } from '@/components/Loader'
import Logo from '@/assets/svgs/icon.svg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const canSubmit = email.trim() !== '' && password !== '' && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      Toast.success('Login realizado com sucesso!')
      router.replace('/(app)/(tabs)')
    } catch {
      Toast.error('Erro ao realizar login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[360px] gap-10">
          <Logo width={156} height={94} />

          <View className="gap-4">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              className="py-3 px-3 rounded-lg border border-black/70 bg-white text-black"
              accessibilityLabel="Campo de e-mail"
              returnKeyType="next"
            />

            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                className="w-full py-3 pl-3 pr-12 rounded-lg border border-black/70 bg-white text-black"
                accessibilityLabel="Campo de senha"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Esconder senha' : 'Mostrar senha'
                }
                hitSlop={8}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} />
              </Pressable>
            </View>

            <Pressable
              disabled={!canSubmit}
              onPress={handleSubmit}
              className={`py-3 rounded-lg items-center justify-center ${canSubmit ? 'bg-black' : 'bg-black/40'}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              {loading ? (
                <Loader />
              ) : (
                <Text className="text-white font-semibold">Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
