import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, Image, ScrollView } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { cssInterop } from 'nativewind';
import { getAuth } from '@react-native-firebase/auth';
import { subscribeToUserScanHistory, type ScanLog } from '../scripts/firestore_handler';

cssInterop(SafeAreaView, { className: 'style' });

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const uid = getAuth().currentUser?.uid;
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    return subscribeToUserScanHistory(
      uid,
      (logs) => {
        setScanLogs(logs);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load scan history:', error);
        setLoading(false);
      }
    );
  }, [uid]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-[70px] px-4 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="w-[40px] h-[40px] rounded-full items-center justify-center">
          <ChevronLeft size={28} color="black" />
        </Pressable>
        <Text className="text-black text-[26px] ml-2" style={{ fontFamily: 'Inter_18pt-SemiBold' }}>History</Text>
      </View>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 10, paddingBottom: 5,rowGap: 5}} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#586256" />
            <Text className="mt-3 text-gray-500">Loading scans...</Text>
          </View>
        ) : scanLogs.length === 0 ? (
          <Text className="py-10 text-center text-gray-500">No scans yet.</Text>
        ) : (
          scanLogs.map((log) => <ScanLogCard key={log.scanId} log={log} onPress={() => navigation.navigate('Analytics', { scanId: log.scanId })} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScanLogCard({ log, onPress }: { log: ScanLog; onPress: () => void }) {
  const scan = log.scan;
  const date = log.timestamp ? log.timestamp.toLocaleDateString() : 'Date unavailable';

  return (
    <Pressable onPress={onPress} className="w-full h-[110px] rounded-[20px] border border-gray-200 flex-row justify-between p-3 mb-2 bg-[#fbf5ee]">
      <View className="w-[85px] h-[85px] rounded-[15px] overflow-hidden bg-gray-200">
        {scan?.imageUrl ? <Image source={{ uri: scan.imageUrl }} className="w-full h-full" resizeMode="cover" /> : null}
      </View>
      <View className="flex-1 ml-3 justify-center">
        <Text className="text-black text-[14px]">Date: {date}</Text>
        <Text className="text-black text-[14px] mt-1">{scan?.foodDetected || 'Scan processing'}</Text>
        <Text className="text-black text-[14px] mt-1">Calories: {scan?.scores.calories ?? '--'}</Text>
        <Text className="text-black text-[14px] mt-1 font-bold">{scan?.grade ? `${scan.grade} Grade` : scan?.processingStatus || '--'}</Text>
      </View>
    </Pressable>
  );
}