import React, {useRef, useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight,RotateCcwClock } from 'lucide-react-native'; 
import { Camera, CameraType } from 'react-native-camera-kit';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

export function Dashboard() {
    console.log('Dashboard rendered');
    const navigation = useNavigation<any>();
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
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
        <View className="h-[80px] px-4 py-0 flex-row justify-between items-center bg-[#eaeee3]"> 
            <Text className="text-[30px] text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Hello, {name}!</Text>
            <Pressable
                onPress={() => navigation.navigate('ProfileScreen')}
                className="w-[45px] h-[45px] items-center justify-center rounded-full bg-[#586256]"
            >
                <Text className="text-white text-center text-[24px]" style={{fontFamily:'Inter_18pt-SemiBold'}}>{initial}</Text>
            </Pressable>
        </View>
        <View className="w-full px-[10px] py-[4px] items-center justify-center bg-[#eaeee3]">
            <GestureDetector gesture={swipeDownGesture}>
                <Pressable onPress={() => setActiveCamera(true)} className="w-full aspect-square rounded-[30px] overflow-hidden bg-gray-300">
                    {activeCamera ?
                        (<View className="flex-1">
                            <Camera style={{ width: '100%', height: '100%' }} cameraType={CameraType.Back} />
                            <View className="absolute bottom-5 left-0 right-0 items-center">
                                <Text className="text-white" style={{fontFamily:'Inter_24pt-Regular'}}>Swipe down to open in full mode</Text>
                            </View>
                        </View>):
                        <Image source={require('../assets/instuction.png')} className="w-full h-full" resizeMode="cover" />
                    }
                </Pressable>
            </GestureDetector>
        </View>

        <View className="flex-row items-center justify-between px-4 py-2 bg-[#eaeee3]">
            <View className="flex-row items-center gap-[5px]">
                <RotateCcwClock size={24} color="#586256" />
                <Text className="text-black text-[24px] leading-[28px] color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>History</Text>
            </View>
            <View className="flex-row items-center">
                <Text className="text-black text-[16px] leading-[28px]" style={{fontFamily:'Inter_24pt-Light'}} onPress={() => navigation.navigate('History')}>More</Text>
                <ChevronRight size={24} color="black" />
            </View>
        </View>

        <ScrollView className="flex-1 px-4 bg-[#eaeee3]" contentContainerStyle={{ paddingTop: 10, paddingBottom: 5,rowGap: 5}} showsVerticalScrollIndicator={false}>

            <Pressable onPress={() => console.log('Card 1 pressed')} className="w-full h-[110px] mb-3 rounded-[20px] bg-[#fbf5ee] border border-gray-200 flex-row items-center p-3">
                <View className="w-[85px] h-[85px] rounded-[15px] overflow-hidden">
                    <Image source={require('../assets/label.jpg')} className="w-full h-full" resizeMode="cover" />
                </View>
                <View className="flex-1 ml-4 justify-center">
                    <Text className="text-black text-[14px]">Date: 07 Sep 2026</Text>
                    <Text className="text-black text-[14px] mt-1">Calories: 450 kcal</Text>
                    <Text className="text-black text-[14px] mt-1">Nutrient: Protein 25g</Text>
                    <Text className="text-black text-[14px] mt-1 font-bold">B Grade</Text>
                </View>
            </Pressable>

            <Pressable onPress={() => console.log('Card 1 pressed')} className="w-full h-[110px] mb-3 rounded-[20px] bg-[#fbf5ee] border border-gray-200 flex-row items-center p-3">
                <View className="w-[85px] h-[85px] rounded-[15px] overflow-hidden">
                    <Image source={require('../assets/label.jpg')} className="w-full h-full" resizeMode="cover" />
                </View>
                <View className="flex-1 ml-4 justify-center">
                    <Text className="text-black text-[14px]">Date: 07 Sep 2026</Text>
                    <Text className="text-black text-[14px] mt-1">Calories: 450 kcal</Text>
                    <Text className="text-black text-[14px] mt-1">Nutrient: Protein 25g</Text>
                    <Text className="text-black text-[14px] mt-1 font-bold">B Grade</Text>
                </View>
            </Pressable>

            <Pressable onPress={() => console.log('Card 1 pressed')} className="w-full h-[110px] mb-3 rounded-[20px] bg-[#fbf5ee] border border-gray-200 flex-row items-center p-3">
                <View className="w-[85px] h-[85px] rounded-[15px] overflow-hidden">
                    <Image source={require('../assets/label.jpg')} className="w-full h-full" resizeMode="cover" />
                </View>
                <View className="flex-1 ml-4 justify-center">
                    <Text className="text-black text-[14px]">Date: 07 Sep 2026</Text>
                    <Text className="text-black text-[14px] mt-1">Calories: 450 kcal</Text>
                    <Text className="text-black text-[14px] mt-1">Nutrient: Protein 25g</Text>
                    <Text className="text-black text-[14px] mt-1 font-bold">B Grade</Text>
                </View>
            </Pressable>

        </ScrollView>
        
    </SafeAreaView>
  );
}