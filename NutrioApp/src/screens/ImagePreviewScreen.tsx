import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Check, Crop } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { getAuth } from '@react-native-firebase/auth';
import { createScanRecord } from '../scripts/firestore_handler';
import { uploadImageToBackend } from '../scripts/image_upload';

export function ImagePreviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { uri: initialUri } = route.params;

    const [uri, setUri] = useState(initialUri);
    const [uploading, setUploading] = useState(false);

    const handleRetake = () => {
        navigation.goBack();
    };

    const handleDone = async () => {
        if (uploading) return;

        const user = getAuth().currentUser;

        if (!user) {
            Alert.alert('Upload failed', 'Please sign in again and try again.');
            return;
        }

        try {
            setUploading(true);

            const uploadResult = await uploadImageToBackend(
                { uri, mimeType: 'image/jpeg' },
                user
            );

            await createScanRecord(user.uid, uploadResult.scanId, uploadResult.url);

            navigation.navigate('History');
        } catch (error) {
            console.error('Failed to save scan:', error);
            Alert.alert('Upload failed', 'We could not save your scan. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCrop = async () => {
        try {
            const cropped = await ImageCropPicker.openCropper({path: uri, width: 1000,height: 1000, cropperToolbarTitle: 'Crop Image', freeStyleCropEnabled: true});

        setUri(cropped.path);
    } catch (error: any) {
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

                <Pressable onPress={handleDone} disabled={uploading} className="items-center justify-center">
                    <View className="w-[56px] h-[56px] rounded-full bg-[#586256] items-center justify-center mb-1">
                        {uploading ? <Text className="text-white text-[12px]">...</Text> : <Check color="white" size={24} />}
                    </View>
                    <Text className="text-white text-[13px]">{uploading ? 'Uploading' : 'Done'}</Text>
                </Pressable>

            </View>

        </SafeAreaView>
    );
}