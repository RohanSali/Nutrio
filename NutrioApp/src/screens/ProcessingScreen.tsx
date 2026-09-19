import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  subscribeToScanRecord,
  type ScanRecord,
} from "../scripts/firestore_handler";

export function ProcessingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [failed, setFailed] = useState(route.params?.processingStatus === "failed");

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event: any) => {
      if (event.data.action.type === "GO_BACK" || event.data.action.type === "POP") {
        event.preventDefault();
        navigation.replace("Dashboard");
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const scanId = route.params?.scanId;
    if (!scanId) return;

    return subscribeToScanRecord(
      scanId,
      (nextScan) => {
        setScan(nextScan);
        if (nextScan?.processingStatus === "complete") {
          navigation.replace("Analytics", { scanId });
        }
        if (nextScan?.processingStatus === "failed") {
          setFailed(true);
        }
      },
      (error) => {
        console.error("Failed to read scan processing status:", error);
        setFailed(true);
      }
    );
  }, [navigation, route.params?.scanId]);

  const goToDashboard = () => navigation.replace("Dashboard");
  const status = failed ? "failed" : scan?.processingStatus || "pending";

  return (
    <SafeAreaView className="flex-1 bg-[#eaeee3]">
      <View className="flex-1 items-center justify-center px-6">
        {!failed && <ActivityIndicator size="large" color="#586256" />}
        <Text className="mt-6 text-center text-[24px] text-[#586256]" style={{ fontFamily: "Inter_18pt-SemiBold" }}>
          {failed ? "Processing failed" : "Processing scan"}
        </Text>
        <Text className="mt-2 text-[16px] text-gray-700">Status: {status}</Text>
        {failed && (
          <Pressable onPress={goToDashboard} className="mt-8 rounded-[24px] bg-[#586256] px-7 py-4">
            <Text className="text-[16px] font-semibold text-white">Go to Dashboard</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}