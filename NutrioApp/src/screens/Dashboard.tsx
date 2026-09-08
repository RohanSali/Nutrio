import React, {useRef, useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight,RotateCcwClock,ScanText } from 'lucide-react-native'; 
import { Camera, CameraType } from 'react-native-camera-kit';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Animated, {useSharedValue,useAnimatedStyle,withRepeat,withTiming,Easing, cancelAnimation} from 'react-native-reanimated';
import { type Language, type Theme, type Units, type UserProfile, subscribeToUserProfile } from "../scripts/profile_handler";
import { getAuth } from "@react-native-firebase/auth";

export function Dashboard() {
    console.log('Dashboard rendered');
    const uid = getAuth().currentUser?.uid;
    const [name, setName] = useState('');
    const [profile, setProfile] = useState<UserProfile>();

    const navigation = useNavigation<any>();
    const cameraRef = useRef<any>(null);
    const [activeCamera, setActiveCamera] = useState(false);
    const scanLinePosition = useSharedValue(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const initial = name[0];

    useEffect(() => {
        if (!uid) return;

        const unsubscribe = subscribeToUserProfile(
            uid,
            (nextProfile) => {
                if (nextProfile) {
                    setProfile(nextProfile);
                    setName(nextProfile.name || '');
                }
            },
            (error) => {
                console.error('Failed to load profile:', error);
            }
        );
        return unsubscribe;
    }, [uid]);

    useEffect(() => {
        if (!activeCamera) return;

        const timer = setTimeout(() => {
            setActiveCamera(false);
        },10000)

        return () => clearTimeout(timer);
    },[activeCamera]);

    useEffect(() => {
        if (!activeCamera) {
            cancelAnimation(scanLinePosition);
            return;
        }
        scanLinePosition.value = 0;
        scanLinePosition.value = withRepeat(
            withTiming(1, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            }),
            -1, // infinite repeat
            true // reverse (so it goes up and down, not snap back)
        );
        return () => {
            cancelAnimation(scanLinePosition);
        };
        }, [activeCamera]);

    const scanLineStyle = useAnimatedStyle(() => {
        return {
            transform: [
            {
                translateY: scanLinePosition.value * containerHeight, // adjust 300 to your camera view's height
            },
            ],
        };
    });

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
    <SafeAreaView className="flex-1 bg-[#eaeee3]" style={{ flex: 1 }}>
        <ScrollView className="flex-1 px-4 bg-[#eaeee3]" contentContainerStyle={{ paddingTop: 10, paddingBottom: 0,rowGap: 5}} showsVerticalScrollIndicator={false}>
            <View className="h-[auto] px-4 flex-row justify-between items-center bg-[#eaeee3]"> 
                <Text className="text-[30px] text-black color-[#586256]" style={{fontFamily:'Inter_18pt-SemiBold'}}>Hello, {name}!</Text>
                <Pressable onPress={() => navigation.navigate('ProfileScreen')} className="w-[45px] h-[45px] items-center justify-center rounded-full bg-[#586256]">
                    <Text className="text-white text-center text-[24px]" style={{fontFamily:'Inter_18pt-SemiBold'}}>{initial}</Text>
                </Pressable>
            </View>
            <View onLayout={(e) => {if (containerHeight === 0) { setContainerHeight(e.nativeEvent.layout.height);}}} className="w-full px-[10px] py-[4px] items-center justify-center bg-[#eaeee3]">
                <GestureDetector gesture={swipeDownGesture}>
                    <Pressable onPress={() => setActiveCamera(true)} className="w-full aspect-square rounded-[30px] overflow-hidden bg-gray-300">
                        {activeCamera ?
                            // Camera Module
                            (<View className="flex-1">
                                <Camera style={{ width: '100%', height: '100%' }} cameraType={CameraType.Back} />
                                <Animated.View style={[{position: 'absolute',left:0, right: 0, height: 2, backgroundColor:'#3b82f6', shadowColor: '#3b82f6',shadowOpacity: 0.8,shadowRadius: 8,shadowOffset: { width: 0, height: 0 }, elevation: 6,}, scanLineStyle]}/>
                                <View className="absolute bottom-[55px] left-0 right-0 items-center">
                                    <Pressable onPress={captureImage} className="w-[55px] h-[55px] items-center justify-center rounded-full bg-[#586256]">
                                        <ScanText color={'white'}/>
                                    </Pressable>
                                </View>
                                <View className="absolute bottom-5 left-0 right-0 items-center">
                                    <Text className="text-white" style={{fontFamily:'Inter_24pt-Regular'}}>Swipe down to open in full mode</Text>
                                </View>
                            </View>):
                            // Hero Image Section
                            <View>
                                <Image source={require('../assets/instuction.png')} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute bottom-[55px] left-0 right-0 items-center">
                                    <Pressable onPress={() => setActiveCamera(true)} className="h-[45px] px-4 flex-row items-center justify-center gap-2 rounded-[24px] bg-[#586256]" style={{ elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6}}>
                                        <ScanText color={'white'} size={20} />
                                        <Text className="text-white text-[16px]" style={{fontFamily: 'Inter_18pt-SemiBold'}}>Scan</Text>
                                    </Pressable>
                                </View>
                            </View>
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