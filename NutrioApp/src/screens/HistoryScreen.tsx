import React from 'react';
import {View,Text,Pressable,Image,ScrollView,} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { cssInterop } from 'nativewind';

cssInterop(SafeAreaView, { className: 'style' });

const historyData = [
  { id: '1', date: '07 Sep 2026', calories: 450, protein: 25, grade: 'B Grade' },
  { id: '2', date: '06 Sep 2026', calories: 320, protein: 18, grade: 'A Grade' },
  { id: '3', date: '05 Sep 2026', calories: 510, protein: 31, grade: 'A Grade' },
  { id: '4', date: '04 Sep 2026', calories: 280, protein: 15, grade: 'B Grade' },
  { id: '5', date: '07 Sep 2026', calories: 450, protein: 25, grade: 'B Grade' },
  { id: '6', date: '06 Sep 2026', calories: 320, protein: 18, grade: 'A Grade' },
  { id: '7', date: '05 Sep 2026', calories: 510, protein: 31, grade: 'A Grade' },
  { id: '8', date: '04 Sep 2026', calories: 280, protein: 15, grade: 'B Grade' },
  { id: '9', date: '07 Sep 2026', calories: 450, protein: 25, grade: 'B Grade' },
  { id: '10', date: '06 Sep 2026', calories: 320, protein: 18, grade: 'A Grade' },
  { id: '11', date: '05 Sep 2026', calories: 510, protein: 31, grade: 'A Grade' },
  { id: '12', date: '04 Sep 2026', calories: 280, protein: 15, grade: 'B Grade' },
  { id: '13', date: '07 Sep 2026', calories: 450, protein: 25, grade: 'B Grade' },
  { id: '14', date: '06 Sep 2026', calories: 320, protein: 18, grade: 'A Grade' },
  { id: '15', date: '05 Sep 2026', calories: 510, protein: 31, grade: 'A Grade' },
  { id: '16', date: '04 Sep 2026', calories: 280, protein: 15, grade: 'B Grade' },
];

export function HistoryScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-[70px] px-4 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="w-[40px] h-[40px] rounded-full items-center justify-center">
          <ChevronLeft size={28} color="black" />
        </Pressable>
        <Text className="text-black text-[26px] ml-2" style={{ fontFamily: 'Inter_18pt-SemiBold' }}>History</Text>
      </View>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 10, paddingBottom: 5,rowGap: 5}} showsVerticalScrollIndicator={false}>
        {historyData.map((item) => (
            <Pressable key={item.id} onPress={() => console.log('Card 1 pressed')} className="w-full h-[110px] rounded-[20px] border border-gray-200 flex-row justify-between p-3 mb-1">
                <View style={{ width: 85, height: 85, borderRadius: 15, overflow: 'hidden', marginRight: 10 }}>
                    <Image source={require('../assets/label.jpg')} className='w-full h-full' resizeMode="cover" />
                </View>
                <View className="flex-1 ml-1 justify-center">
                    <Text className="text-black text-[14px]">Date: {item.date}</Text>
                    <Text className="text-black text-[14px] mt-1">Calories: {item.calories}</Text>
                    <Text className="text-black text-[14px] mt-1">Nutrient: {item.protein}</Text>
                    <Text className="text-black text-[14px] mt-1 font-bold">{item.grade}</Text>
                </View>
            </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}