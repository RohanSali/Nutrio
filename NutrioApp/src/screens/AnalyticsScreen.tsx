import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export function AnalyticsScreen() {
	const navigation = useNavigation<any>();

	useEffect(() => {
		const unsubscribe = navigation.addListener("beforeRemove", (event: any) => {
			if (event.data.action.type === "GO_BACK" || event.data.action.type === "POP") {
				event.preventDefault();
				navigation.replace("Dashboard");
			}
		});

		return unsubscribe;
	}, [navigation]);

	const goToDashboard = () => navigation.replace("Dashboard");

	return (
		<SafeAreaView className="flex-1 bg-[#eaeee3]">
			<View className="flex-1 items-center justify-center px-6">
				<Text className="text-[28px] text-[#586256]" style={{ fontFamily: "Inter_18pt-SemiBold" }}>
					Scan complete
				</Text>
				<Text className="mt-3 text-[16px] text-gray-700">Status: Success</Text>
				<Pressable onPress={goToDashboard} className="mt-8 rounded-[24px] bg-[#586256] px-7 py-4">
					<Text className="text-[16px] font-semibold text-white">Go to Dashboard</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
