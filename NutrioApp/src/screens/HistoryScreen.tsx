import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { cssInterop } from 'nativewind';
import { getAuth } from '@react-native-firebase/auth';
import { subscribeToUserScanHistory, type ScanLog } from '../scripts/firestore_handler';

cssInterop(SafeAreaView, { className: 'style' });

const ACCENT = '#586256';

const GRADE_COLORS: Record<string, string> = {
  A: '#3F9C5A',
  B: '#7FB539',
  C: '#E0A93B',
  D: '#E07B39',
  E: '#D24B41',
};

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const uid = getAuth().currentUser?.uid;
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  const horizontalPadding = width < 360 ? 14 : width < 600 ? 18 : 24;
  const contentMaxWidth = width >= 600 ? 720 : 600;

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
    <SafeAreaView className="flex-1 bg-[#EAEEE3]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full" style={{ maxWidth: contentMaxWidth }}>
          {/* Header */}
          <View className="h-[70px] flex-row items-center">
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#FBF5EE]"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft color={ACCENT} size={28} strokeWidth={2.2} />
            </Pressable>

            <View className="ml-3 flex-1">
              <Text
                className="text-[26px] text-[#586256]"
                style={{ fontFamily: 'Inter_18pt-SemiBold' }}
              >
                History
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-14">
              <ActivityIndicator size="large" color={ACCENT} />
              <Text className="mt-3 text-[14px] text-gray-500">Loading scans...</Text>
            </View>
          ) : scanLogs.length === 0 ? (
            <View className="mt-4 items-center rounded-[20px] border border-gray-200 bg-[#FBF5EE] px-6 py-12">
              <Text
                className="text-[18px] text-[#586256]"
                style={{ fontFamily: 'Inter_18pt-SemiBold' }}
              >
                No scans yet
              </Text>
              <Text className="mt-2 text-center text-[14px] text-gray-500">
                Your scanned labels will appear here.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-5 px-1 text-[13px] font-semibold tracking-wider text-[#586256]">
                PAST SCANS
              </Text>

              {scanLogs.map((log) => (
                <ScanLogCard
                  key={log.scanId}
                  log={log}
                  onPress={() => navigation.navigate('Analytics', { scanId: log.scanId })}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScanLogCard({ log, onPress }: { log: ScanLog; onPress: () => void }) {
  const scan = log.scan;
  const date = log.timestamp ? log.timestamp.toLocaleDateString() : 'Date unavailable';
  const gradeColor = scan?.grade ? GRADE_COLORS[scan.grade] ?? ACCENT : '#9CA3AF';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 w-full flex-row items-center rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-3"
    >
      <View className="h-[85px] w-[85px] overflow-hidden rounded-[15px] bg-gray-200">
        {scan?.imageUrl ? (
          <Image source={{ uri: scan.imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : null}
      </View>

      <View className="ml-4 flex-1 justify-center">
        <Text
          className="text-[16px] text-[#586256]"
          style={{ fontFamily: 'Inter_18pt-SemiBold' }}
          numberOfLines={1}
        >
          {scan?.foodDetected || 'Scan processing'}
        </Text>

        <Text className="mt-1 text-[13px] text-gray-500">{date}</Text>

        <Text className="mt-1 text-[13px] text-gray-600">
          Calories: {scan?.scores.calories ?? '--'}
        </Text>

        <Text className="mt-1 text-[13px] font-semibold" style={{ color: gradeColor }}>
          {scan?.grade ? `${scan.grade} Grade` : scan?.processingStatus || '--'}
        </Text>
      </View>

      <ChevronRight color={ACCENT} size={20} />
    </Pressable>
  );
}