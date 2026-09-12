import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { saveUserBasicInfo } from "../scripts/firestore_handler";

import {ALLERGY_OPTIONS,NONE_OPTION,} from "../constants/allergies";

export function FetchInfoScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState<string[]>([NONE_OPTION]);
  const [allergySearch, setAllergySearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const filteredAllergyOptions = useMemo(() => {
    const query = allergySearch.trim().toLowerCase();

    if (!query) {
      return ALLERGY_OPTIONS;
    }

    return ALLERGY_OPTIONS.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [allergySearch]);

  const toggleAllergy = (option: string): void => {
    setAllergies((current) => {
      if (option === NONE_OPTION) {
        return current.includes(NONE_OPTION) ? [] : [NONE_OPTION];
      }

      const withoutNone = current.filter((item) => item !== NONE_OPTION);

      return withoutNone.includes(option)
        ? withoutNone.filter((item) => item !== option)
        : [...withoutNone, option];
    });
  };

  const handleComplete = async (): Promise<void> => {
    const uid = getAuth().currentUser?.uid;

    if (!uid) {
      return;
    }

    const cleanName = name.trim();
    const heightValue = Number(height);
    const weightValue = Number(weight);
    const ageValue = Number(age);

    if (!cleanName) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }

    if (!height || Number.isNaN(heightValue) || heightValue <= 0) {
      Alert.alert("Invalid height", "Please enter your height in cm.");
      return;
    }

    if (!weight || Number.isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("Invalid weight", "Please enter your weight in kg.");
      return;
    }

    if (!age || Number.isNaN(ageValue) || ageValue <= 0) {
      Alert.alert("Invalid age", "Please enter your age.");
      return;
    }

    if (allergies.length === 0) {
      Alert.alert("Missing allergies", "Please select at least one option, or None.");
      return;
    }

    try {
      setSaving(true);
      await saveUserBasicInfo(uid, {
        name: cleanName,
        height: heightValue,
        weight: weightValue,
        age: ageValue,
        allergies,
      });
    } catch {
      Alert.alert(
        "Unable to save your information",
        "Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#EAEEE3]">
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" enableOnAndroid>
        <View className="flex-1 px-6 py-8">
          <Text className="text-3xl font-bold text-[#586256]">Tell us about yourself</Text>
          <Text className="mt-3 text-base text-gray-600">Complete your profile to continue to Nutrio.</Text>

          <View className="mt-8">
            <Text className="mb-2 text-sm font-semibold text-[#586256]">Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#9CA3AF" editable={!saving} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
          </View>

          <View className="mt-5 flex-row gap-4">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-semibold text-[#586256]">Height (cm)</Text>
              <TextInput value={height} onChangeText={setHeight} placeholder="170" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" editable={!saving} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-sm font-semibold text-[#586256]">Weight (kg)</Text>
              <TextInput value={weight} onChangeText={setWeight} placeholder="65" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" editable={!saving} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
            </View>
          </View>

          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-[#586256]">Age</Text>
            <TextInput value={age} onChangeText={setAge} placeholder="25" placeholderTextColor="#9CA3AF" keyboardType="number-pad" editable={!saving} className="h-14 w-24 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
          </View>

          <View className="mt-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-[#586256]">Allergies</Text>
              <Text className="text-xs text-gray-500">{allergies.includes(NONE_OPTION) ? "None selected" : `${allergies.length} selected`}</Text>
            </View>
            <Pressable onPress={() => toggleAllergy(NONE_OPTION)} disabled={saving} className={`mb-3 self-start rounded-full border px-4 py-2 ${allergies.includes(NONE_OPTION) ? "border-[#586256] bg-[#586256]" : "border-gray-200 bg-[#FBF5EE]"}`}>
              <Text className={`text-sm font-medium ${allergies.includes(NONE_OPTION) ? "text-white" : "text-gray-700"}`}>None</Text>
            </Pressable>
            <TextInput value={allergySearch} onChangeText={setAllergySearch} placeholder="Search allergies or intolerances" placeholderTextColor="#9CA3AF" editable={!saving} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
            <View className="mt-3 max-h-72 rounded-2xl border border-gray-200 bg-[#FBF5EE]">
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredAllergyOptions.length === 0 ? (
                  <Text className="px-4 py-4 text-sm text-gray-400">No matches found.</Text>
                ) : filteredAllergyOptions.map((option, index) => {
                  const selected = allergies.includes(option);
                  return (
                    <Pressable key={option} onPress={() => toggleAllergy(option)} disabled={saving} className={`flex-row items-center justify-between px-4 py-3 ${index !== filteredAllergyOptions.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <Text className="flex-1 pr-3 text-sm text-gray-800">{option}</Text>
                      <View className={`h-5 w-5 items-center justify-center rounded-md border ${selected ? "border-[#586256] bg-[#586256]" : "border-gray-300 bg-white"}`}>
                        {selected && <Text className="text-xs font-bold text-white">✓</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <Pressable className="mt-8 h-14 w-full items-center justify-center rounded-2xl bg-[#586256]" disabled={saving} onPress={handleComplete}>
            {saving ? <ActivityIndicator color="white" /> : <Text className="text-base font-semibold text-white">Continue to Dashboard</Text>}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default FetchInfoScreen;