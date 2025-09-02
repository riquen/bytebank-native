import { Text, View } from "react-native";
 
export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-6xl text-red-500">Welcome!</Text>
      <Text className="text-6xl font-inter-regular text-red-500">Welcome!</Text>
      <Text className="text-6xl font-bold text-green-500">Welcome!</Text>
      <Text className="text-6xl font-inter-bold text-green-500">Welcome!</Text>
    </View>
  );
}