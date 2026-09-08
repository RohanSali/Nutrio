import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Check, Crop } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageCropPicker from 'react-native-image-crop-picker';

export function ImagePreviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { uri: initialUri } = route.params;

    const [uri, setUri] = useState(initialUri);

    const handleRetake = () => {
        navigation.goBack();
    };

    const handleDone = () => {
        // TODO: decide what happens with the final image
        console.log('Done with image:', uri);
    };

    const handleCrop = async () => {
        try {
            const cropped = await ImageCropPicker.openCropper({path: uri, width: 1000,height: 1000, cropperToolbarTitle: 'Crop Image', freeStyleCropEnabled: true});

            setUri(cropped.path);
        } catch (error: any) {
            // User cancelling the crop throws an error too — ignore that case silently
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.error('Crop failed:', error);
                Alert.alert('Crop failed', 'Please try again.');
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black" style={{ flex: 1 }}>

            <View className="flex-1">
                <Image
                    source={{ uri }}
                    className="w-full h-full"
                    resizeMode="contain"
                />
            </View>

            <View className="flex-row items-center justify-around px-6 py-6 bg-black/80">

                <Pressable onPress={handleRetake} className="items-center justify-center">
                    <View className="w-[56px] h-[56px] rounded-full bg-white/10 items-center justify-center mb-1">
                        <RotateCcw color="white" size={24} />
                    </View>
                    <Text className="text-white text-[13px]">Retake</Text>
                </Pressable>

                <Pressable onPress={handleCrop} className="items-center justify-center">
                    <View className="w-[56px] h-[56px] rounded-full bg-white/10 items-center justify-center mb-1">
                        <Crop color="white" size={24} />
                    </View>
                    <Text className="text-white text-[13px]">Crop</Text>
                </Pressable>

                <Pressable onPress={handleDone} className="items-center justify-center">
                    <View className="w-[56px] h-[56px] rounded-full bg-[#586256] items-center justify-center mb-1">
                        <Check color="white" size={24} />
                    </View>
                    <Text className="text-white text-[13px]">Done</Text>
                </Pressable>

            </View>

        </SafeAreaView>
    );
}