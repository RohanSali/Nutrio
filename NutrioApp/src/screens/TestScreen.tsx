import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from "react-native-image-crop-picker";
import { getAuth } from "@react-native-firebase/auth";
import { uploadImageToBackend } from "../scripts/image_upload";
import { ChevronLeft } from "lucide-react-native";
import { IMAGEKIT_BASE_URL } from "../config/api";

export function TestScreen({ navigation }: any) {
  const [showPath, setShowPath] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const imageUrl = `${IMAGEKIT_BASE_URL}/${showPath.trim().replace(/^\/+/, "")}`;

  const handleSelectImage = async () => {
    try {
      const firebaseUser = getAuth().currentUser;

      if (!firebaseUser) {
        throw new Error("User is not authenticated.");
      }

      const image = await ImagePicker.openPicker({
        mediaType: "photo",
        cropping: false,
      });

      setIsUploading(true);
      await uploadImageToBackend(
        {
          uri: image.path,
          fileName: image.filename,
          mimeType: image.mime,
        },
        firebaseUser,
      );
    } catch (error: any) {
      if (error?.code !== "E_PICKER_CANCELLED") {
        console.error("Test image upload failed:", error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#eaeee3]" style={{ flex: 1 }}>
      <ScrollView className="flex-1 px-6 bg-[#eaeee3]" contentContainerStyle={{ paddingTop: 10, paddingBottom: 0,rowGap: 5}} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-4 mt-2">
          <Pressable
              onPress={() => navigation?.goBack?.()}
              className="h-8 w-8 items-center justify-center rounded-full bg-[#FBF5EE]"
              accessibilityRole="button"
              accessibilityLabel="Go back"
          >
            <ChevronLeft color="#586256" size={20} strokeWidth={2.2} />
          </Pressable>
          <Text className="text-3xl text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Test Screen</Text>
        </View>
        <View className="flex-1 mt-8 gap-4">
          <View className="flex-row items-center gap-5">
            <Text className="text-xl text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Upload Image:</Text>
            <Pressable onPress={handleSelectImage} disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="#586256" />
              ) : (
                <Text className="text-base text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Select Image</Text>
              )}
            </Pressable>
          </View>
        </View>
        <View className="flex-1 mt-8 gap-4">
          <Text className="text-xl text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Choose Image to display</Text>
          <TextInput value={showPath} onChangeText={setShowPath} className="flex-1 h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
          {showPath.trim() ? (
            <Image
              source={{ uri: imageUrl }}
              className="mt-4 h-64 w-full rounded-2xl"
              resizeMode="contain"
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default TestScreen;