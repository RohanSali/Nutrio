import React, {useRef, useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight,RotateCcwClock   } from 'lucide-react-native'; 
import { Camera, CameraType } from 'react-native-camera-kit';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

export function Dashboard() {
    console.log('Dashboard rendered');
    const navigation = useNavigation();
    const cameraRef = useRef<any>(null);
    const [name, setName] = useState('Aadi');
    const [activeCamera, setActiveCamera] = useState(true);

    const initial = name[0];

    useEffect(() => {
        if (!activeCamera) return;

        const timer = setTimeout(() => {
            setActiveCamera(false);
        },10000)

        return () => clearTimeout(timer);
    },[activeCamera]);

    const captureImage = async () => {
        if (cameraRef.current) {
        const data = await cameraRef.current.capture();
        console.log('Captured Image URI:', data.uri); // Path to temporary JPEG
        }
    };
    
    const swipeDownGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd(event => {
        if (activeCamera && event.translationY > 100 ) {
            setActiveCamera(false);

            setTimeout(() => {
                navigation.navigate('FullScreenCamera');
            }, 100);
        }
    });

  return (
    <SafeAreaView className="flex-1 bg-white">
        <View className="h-[80px] px-4 py-0 flex-row justify-between items-center"> 
            <Text className="text-[30px] font-bold text-black ">Hello {name}!</Text>
            <View className="w-[50px] h-[50px] items-center justify-center rounded-full bg-blue-500">
                <Text className="text-white text-center text-[24px] font-bold">{initial}</Text>
            </View>
        </View>
        <View className="w-full px-[10px] py-[4px] items-center justify-center">
            <GestureDetector gesture={swipeDownGesture}>
                <Pressable onPress={() => setActiveCamera(true)} className="w-full aspect-square rounded-[30px] overflow-hidden bg-gray-300">
                    {activeCamera ?
                        (<View className="flex-1">
                            <Camera style={{ width: '100%', height: '100%' }} cameraType={CameraType.Back} />
                            <View className="absolute bottom-5 left-0 right-0 items-center">
                                <Text className="text-white font-bold">Swipe down to open in full mode</Text>
                            </View>
                        </View>):
                        <Image source={require('../assets/instuction.png')} className="w-full h-full" resizeMode="cover" />
                    }
                </Pressable>
            </GestureDetector>
        </View>
        <View className="h-[auto] flex-row items-center gap-[5px] px-4 py-2">
            <RotateCcwClock/>
            <Text className="text-black text-[24px] font-bold">History</Text>
        </View>
        <View className="flex-1 px-4 flex-row justify-end">
            <Text className="text-black text-[16px] font-bold mr-1">More</Text>
            <ChevronRight  size={24} color="black" />
        </View>
    </SafeAreaView>
  );
}