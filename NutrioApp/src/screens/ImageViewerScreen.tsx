import React from "react";
import { Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";

export function ImageViewerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { uri } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center">
        <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />
      </View>
      <Pressable
        onPress={() => navigation.goBack()}
        className="absolute left-5 top-5 h-11 w-11 items-center justify-center rounded-full bg-black/60"
        accessibilityRole="button"
        accessibilityLabel="Close image"
      >
        <ChevronLeft color="white" size={28} />
      </Pressable>
    </SafeAreaView>
  );
}
