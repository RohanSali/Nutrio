import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image as RNImage, Pressable, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Check, Crop } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import { createScanRecord } from '../scripts/firestore_handler';
import { uploadImageToBackend } from '../scripts/image_upload';
import ImageEditor from '@react-native-community/image-editor';
import { ResizableCropper, ResizableCropperHandle } from './ResizableCropper';

export function ImagePreviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { uri: initialUri } = route.params;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const [uri, setUri] = useState(initialUri);
    const [uploading, setUploading] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

    const cropperRef = useRef<ResizableCropperHandle>(null);

    useEffect(() => {
        RNImage.getSize(
            uri,
            (width, height) => setNaturalSize({ width, height }),
            (err) => console.error('getSize failed:', err)
        );
    }, [uri]);

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
            const uploadResult = await uploadImageToBackend({ uri, mimeType: 'image/jpeg' }, user);
            await createScanRecord(user.uid, uploadResult.scanId, uploadResult.url);
            navigation.navigate('History');
        } catch (error) {
            console.error('Failed to save scan:', error);
            Alert.alert('Upload failed', 'We could not save your scan. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCropConfirm = async () => {
        if (!cropperRef.current) return;
        try {
            const rect = cropperRef.current.getCropRect();

            const cropData = {
                offset: { x: Math.round(rect.x), y: Math.round(rect.y) },
                size: { width: Math.round(rect.width), height: Math.round(rect.height) },
            };

            const result = await ImageEditor.cropImage(uri, cropData);
            const newUri = (result as any).uri ?? result;
            setUri(newUri);
            setIsCropping(false);
        } catch (error) {
            console.error('Crop failed:', error);
            Alert.alert('Crop failed', 'Please try again.');
        }
    };

    if (isCropping && naturalSize) {
        return (
            <SafeAreaView className="flex-1 bg-black">
                <View className="flex-1 items-center justify-center">
                    <ResizableCropper
                        ref={cropperRef}
                        uri={uri}
                        imageWidth={naturalSize.width}
                        imageHeight={naturalSize.height}
                        containerWidth={screenWidth}
                        containerHeight={screenHeight - 140} // leaves room for the bottom button bar
                    />
                </View>

                <View className="flex-row items-center justify-around px-6 py-6 bg-black/80">
                    <Pressable onPress={() => setIsCropping(false)} className="items-center justify-center">
                        <Text className="text-white text-[15px]">Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleCropConfirm} className="items-center justify-center">
                        <View className="w-[56px] h-[56px] rounded-full bg-[#586256] items-center justify-center mb-1">
                            <Check color="white" size={24} />
                        </View>
                        <Text className="text-white text-[13px]">Use crop</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" style={{ flex: 1 }}>
            <View className="flex-1">
                <RNImage source={{ uri }} className="w-full h-full" resizeMode="contain" />
            </View>

            <View className="flex-row items-center justify-around px-6 py-6 bg-black/80">
                <Pressable onPress={handleRetake} className="items-center justify-center">
                    <View className="w-[56px] h-[56px] rounded-full bg-white/10 items-center justify-center mb-1">
                        <RotateCcw color="white" size={24} />
                    </View>
                    <Text className="text-white text-[13px]">Retake</Text>
                </Pressable>

                <Pressable onPress={() => setIsCropping(true)} className="items-center justify-center">
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