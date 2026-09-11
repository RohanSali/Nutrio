import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "@react-native-firebase/auth";
import { ChevronLeft, ChevronRight, LogOut, Trash2 } from "lucide-react-native";

import {
  type Language,
  type Theme,
  type Units,
  type UserProfile,
  logoutUser,
  subscribeToUserProfile,
  updateUserAllergies,
  updateUserProfile,
  updateUserSettings,
} from "../scripts/firestore_handler";

import {ALLERGY_OPTIONS,NONE_OPTION,} from "../constants/allergies";

const DEFAULT_PROFILE: UserProfile = {
  onboardingComplete: false,
  name: "",
  height: 0,
  weight: 0,
  age: 0,
  allergies: [NONE_OPTION],
  language: "English",
  units: "Metric",
  theme: "System",
};

export function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const uid = getAuth().currentUser?.uid;

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [allergyVisible, setAllergyVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([
    NONE_OPTION,
  ]);
  const [allergySearch, setAllergySearch] = useState("");

  const [language, setLanguage] = useState<Language>("English");
  const [units, setUnits] = useState<Units>("Metric");
  const [theme, setTheme] = useState<Theme>("System");

  const horizontalPadding =
    width < 360 ? 14 : width < 600 ? 18 : 24;
  const contentMaxWidth = width >= 600 ? 720 : 600;
  const modalMaxWidth =
    width >= 900 ? 720 : width >= 600 ? 600 : undefined;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserProfile(
      uid,
      (nextProfile) => {
        const next = nextProfile ?? DEFAULT_PROFILE;

        setProfile(next);
        setLanguage(next.language ?? "English");
        setUnits(next.units ?? "Metric");
        setTheme(next.theme ?? "System");

        setLoading(false);
      },
      (error) => {
        console.error("Failed to load profile:", error);
        setLoading(false);
        Alert.alert(
          "Unable to load profile",
          "Please check your connection and try again."
        );
      }
    );

    return unsubscribe;
  }, [uid]);

  const bmi = useMemo(() => {
    if (profile.height <= 0 || profile.weight <= 0) {
      return null;
    }

    const heightInMeters = profile.height / 100;
    return profile.weight / (heightInMeters * heightInMeters);
  }, [profile.height, profile.weight]);

  const bmiText = bmi ? bmi.toFixed(1) : "—";

  const bmiCategory = useMemo(() => {
    if (bmi === null) return "Enter height and weight";

    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  }, [bmi]);

  const filteredAllergyOptions = useMemo(() => {
    const query = allergySearch.trim().toLowerCase();

    if (!query) return ALLERGY_OPTIONS;

    return ALLERGY_OPTIONS.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [allergySearch]);

  const openEditProfile = () => {
    setEditName(profile.name);
    setEditAge(profile.age ? String(profile.age) : "");
    setEditHeight(profile.height ? String(profile.height) : "");
    setEditWeight(profile.weight ? String(profile.weight) : "");
    setEditVisible(true);
  };

  const saveProfile = async () => {
    if (!uid) return;

    const cleanName = editName.trim();
    const age = Number(editAge);
    const height = Number(editHeight);
    const weight = Number(editWeight);

    if (!cleanName) {
      Alert.alert("Invalid name", "Please enter your name.");
      return;
    }

    if (!Number.isFinite(age) || age <= 0) {
      Alert.alert("Invalid age", "Please enter a valid age.");
      return;
    }

    if (!Number.isFinite(height) || height <= 0) {
      Alert.alert("Invalid height", "Please enter height in cm.");
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      Alert.alert("Invalid weight", "Please enter weight in kg.");
      return;
    }

    try {
      setSaving(true);

      await updateUserProfile(uid, {
        name: cleanName,
        age,
        height,
        weight,
        onboardingComplete: true,
      });

      setEditVisible(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert(
        "Unable to update profile",
        "Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = (option: string) => {
    setSelectedAllergies((current) => {
      if (option === NONE_OPTION) {
        return current.includes(NONE_OPTION) ? [] : [NONE_OPTION];
      }

      const withoutNone = current.filter((item) => item !== NONE_OPTION);

      return withoutNone.includes(option)
        ? withoutNone.filter((item) => item !== option)
        : [...withoutNone, option];
    });
  };

  const openAllergies = () => {
    setSelectedAllergies(
      profile.allergies?.length ? [...profile.allergies] : [NONE_OPTION]
    );
    setAllergySearch("");
    setAllergyVisible(true);
  };

  const saveAllergies = async () => {
    if (!uid) return;

    if (selectedAllergies.length === 0) {
      Alert.alert(
        "Select an option",
        "Choose at least one allergy/intolerance or select None."
      );
      return;
    }

    try {
      setSaving(true);
      await updateUserAllergies(uid, selectedAllergies);
      setAllergyVisible(false);
    } catch (error) {
      console.error("Failed to update allergies:", error);
      Alert.alert(
        "Unable to update allergies",
        "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!uid) return;

    try {
      setSaving(true);

      await updateUserSettings(uid, {
        language,
        units,
        theme,
      });

      setSettingsVisible(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      Alert.alert(
        "Unable to update settings",
        "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
    } catch (error) {
      console.error("Failed to log out:", error);
      Alert.alert("Unable to log out", "Please try again.");
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#EAEEE3]">
        <ActivityIndicator size="large" color="#586256" />
      </SafeAreaView>
    );
  }

  const displayName =
    profile.name || getAuth().currentUser?.displayName || "Nutrio user";

  const allergySummary =
    profile.allergies?.length && !profile.allergies.includes(NONE_OPTION)
      ? profile.allergies.join(", ")
      : "None";

  return (
    <SafeAreaView className="flex-1 bg-[#EAEEE3]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 40,
          alignItems: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full"
          style={{ maxWidth: contentMaxWidth }}
        >
          {/* Header */}
          <View className="h-[70px] flex-row items-center">
            <Pressable
              onPress={() => navigation?.goBack?.()}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#FBF5EE]"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft color="#586256" size={28} strokeWidth={2.2} />
            </Pressable>

            <View className="ml-3 flex-1">
              <Text className="text-[26px] font-semibold text-[#586256]">
                Profile
              </Text>
            </View>
          </View>

          {/* Profile summary */}
          <View className="mt-4 rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-5">
            <Text
              className="text-[28px] font-semibold text-[#586256]"
              numberOfLines={2}
            >
              {displayName}
            </Text>

            <Text
              className="mt-1 text-[15px] text-gray-500"
              numberOfLines={1}
            >
              {getAuth().currentUser?.email || "Manage your Nutrio profile"}
            </Text>

            <Pressable
              onPress={openEditProfile}
              className="mt-5 h-11 items-center justify-center rounded-2xl bg-[#586256]"
            >
              <Text className="text-[15px] font-semibold text-white">
                Edit Profile
              </Text>
            </Pressable>
          </View>

          {/* Personal */}
          <SectionTitle title="PERSONAL" />

          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-[#FBF5EE]">
            <InfoRow label="Name" value={profile.name || "Not set"} />
            <InfoRow
              label="Age"
              value={profile.age > 0 ? `${profile.age} years` : "Not set"}
            />
            <InfoRow
              label="Height"
              value={
                profile.height > 0 ? `${profile.height} cm` : "Not set"
              }
            />
            <InfoRow
              label="Weight"
              value={
                profile.weight > 0 ? `${profile.weight} kg` : "Not set"
              }
            />
            <InfoRow
              label="BMI"
              value={`${bmiText} • ${bmiCategory}`}
              last
            />
          </View>

          {/* Food & Safety */}
          <SectionTitle title="FOOD & SAFETY" />

          <Pressable
            onPress={openAllergies}
            className="rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-5"
          >
            <View className="flex-row items-center">
              <View className="flex-1 pr-3">
                <Text className="text-[16px] font-semibold text-[#586256]">
                  Food Allergies
                </Text>
                <Text
                  className="mt-1 text-[14px] text-gray-500"
                  numberOfLines={3}
                >
                  {allergySummary}
                </Text>
              </View>
              <ChevronRight color="#586256" size={22} />
            </View>
          </Pressable>

          {/* App Settings */}
          <SectionTitle title="APP SETTINGS" />

          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-[#FBF5EE]">
            <SettingRow
              label="Language"
              value={profile.language ?? "English"}
              onPress={() => setSettingsVisible(true)}
            />
            <SettingRow
              label="Units"
              value={profile.units ?? "Metric"}
              onPress={() => setSettingsVisible(true)}
            />
            <SettingRow
              label="Theme"
              value={profile.theme ?? "System"}
              onPress={() => setSettingsVisible(true)}
              last
            />
          </View>

          {/* About */}
          <SectionTitle title="ABOUT" />

          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-[#FBF5EE]">
            <MenuRow
              label="About Nutrio"
              onPress={() =>
                Alert.alert(
                  "About Nutrio",
                  "Nutrio helps you understand packaged-food labels, ingredients, nutrients, additives and allergens in a simple way."
                )
              }
            />
            <MenuRow
              label="Help & Support"
              onPress={() =>
                Alert.alert(
                  "Help & Support",
                  "For now, please contact your project support team."
                )
              }
            />
            <MenuRow
              label="Privacy Policy"
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Your Nutrio profile information is stored in your Firebase Firestore user document."
                )
              }
            />
            <MenuRow
              label="Terms & Conditions"
              onPress={() =>
                Alert.alert(
                  "Terms & Conditions",
                  "Nutrio provides food-label information for general awareness and should not replace professional medical advice."
                )
              }
            />
            <InfoRow label="App Version" value="1.0.0" last />
          </View>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className="mt-6 h-14 flex-row items-center justify-center rounded-[20px] bg-[#586256]"
          >
            {loggingOut ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <LogOut color="white" size={19} />
                <Text className="ml-2 text-[16px] font-semibold text-white">
                  Logout
                </Text>
              </>
            )}
          </Pressable>

          {/*Test Code*/}
          <Pressable onPress={() => navigation.navigate('TestScreen')} className="mt-5 mb-5 h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-[#FBF5EE]">
            <Text className="text-base font-semibold text-gray-800">Go to TestPage</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/40"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="rounded-t-[28px] bg-white p-5"
            style={{
              width: "100%",
              maxWidth: modalMaxWidth,
              alignSelf: "center",
              maxHeight: "88%",
            }}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[22px] font-semibold text-[#586256]">
                Edit Profile
              </Text>
              <Pressable
                onPress={() => setEditVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#EAEEE3]"
              >
                <Text className="text-xl text-[#586256]">×</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <InputLabel label="Name" />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="min-h-[54px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
              />

              <InputLabel label="Age" />
              <TextInput
                value={editAge}
                onChangeText={setEditAge}
                placeholder="25"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="min-h-[54px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
              />

              <InputLabel label="Height (cm)" />
              <TextInput
                value={editHeight}
                onChangeText={setEditHeight}
                placeholder="170"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="min-h-[54px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
              />

              <InputLabel label="Weight (kg)" />
              <TextInput
                value={editWeight}
                onChangeText={setEditWeight}
                placeholder="65"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="min-h-[54px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
              />

              <Pressable
                onPress={saveProfile}
                disabled={saving}
                className="mt-7 h-14 items-center justify-center rounded-2xl bg-[#586256]"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Allergies Modal */}
      <Modal
        visible={allergyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllergyVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/40"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="rounded-t-[28px] bg-white p-5"
            style={{
              width: "100%",
              maxWidth: modalMaxWidth,
              alignSelf: "center",
              maxHeight: "90%",
            }}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[22px] font-semibold text-[#586256]">
                Food Allergies
              </Text>
              <Pressable
                onPress={() => setAllergyVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#EAEEE3]"
              >
                <Text className="text-xl text-[#586256]">×</Text>
              </Pressable>
            </View>

            <TextInput
              value={allergySearch}
              onChangeText={setAllergySearch}
              placeholder="Search allergies or intolerances"
              placeholderTextColor="#9CA3AF"
              editable={!saving}
              className="min-h-[54px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
            />

            <ScrollView
              className="mt-3"
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                onPress={() => toggleAllergy(NONE_OPTION)}
                className={`mb-2 self-start rounded-full border px-4 py-2 ${
                  selectedAllergies.includes(NONE_OPTION)
                    ? "border-[#586256] bg-[#586256]"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedAllergies.includes(NONE_OPTION)
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  None
                </Text>
              </Pressable>

              {filteredAllergyOptions.map((option) => {
                const selected = selectedAllergies.includes(option);

                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleAllergy(option)}
                    className="flex-row items-center border-b border-gray-100 px-1 py-3"
                  >
                    <Text className="flex-1 pr-3 text-sm text-gray-800">
                      {option}
                    </Text>
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-md border ${
                        selected
                          ? "border-[#586256] bg-[#586256]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected && (
                        <Text className="text-xs font-bold text-white">✓</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {filteredAllergyOptions.length === 0 && (
                <Text className="py-6 text-center text-sm text-gray-400">
                  No matches found.
                </Text>
              )}
            </ScrollView>

            <Pressable
              onPress={saveAllergies}
              disabled={saving}
              className="mt-4 h-14 items-center justify-center rounded-2xl bg-[#586256]"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Save Allergies
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/40"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="rounded-t-[28px] bg-white p-5"
            style={{
              width: "100%",
              maxWidth: modalMaxWidth,
              alignSelf: "center",
            }}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[22px] font-semibold text-[#586256]">
                App Settings
              </Text>
              <Pressable
                onPress={() => setSettingsVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#EAEEE3]"
              >
                <Text className="text-xl text-[#586256]">×</Text>
              </Pressable>
            </View>

            <OptionGroup
              title="Language"
              value={language}
              options={["English", "Hindi", "Marathi"]}
              onChange={(value) => setLanguage(value as Language)}
            />

            <OptionGroup
              title="Units"
              value={units}
              options={["Metric", "Imperial"]}
              onChange={(value) => setUnits(value as Units)}
            />

            <OptionGroup
              title="Theme"
              value={theme}
              options={["Light", "Dark", "System"]}
              onChange={(value) => setTheme(value as Theme)}
            />

            <Pressable
              onPress={saveSettings}
              disabled={saving}
              className="mt-6 h-14 items-center justify-center rounded-2xl bg-[#586256]"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Save Settings
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-7 px-1 text-[13px] font-semibold tracking-wider text-[#586256]">
      {title}
    </Text>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`min-h-[58px] flex-row items-center px-5 py-3 ${
        last ? "" : "border-b border-gray-200"
      }`}
    >
      <Text className="flex-1 pr-4 text-[15px] text-gray-700">{label}</Text>
      <Text
        className="max-w-[62%] shrink text-right text-[15px] font-medium text-[#586256]"
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onPress,
  last = false,
}: {
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[58px] flex-row items-center px-5 py-3 ${
        last ? "" : "border-b border-gray-200"
      }`}
    >
      <Text className="flex-1 pr-4 text-[15px] text-gray-700">{label}</Text>
      <Text className="mr-2 text-[15px] font-medium text-[#586256]">
        {value}
      </Text>
      <ChevronRight color="#586256" size={20} />
    </Pressable>
  );
}

function MenuRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[58px] flex-row items-center border-b border-gray-200 px-5 py-3"
    >
      <Text className="flex-1 text-[15px] text-gray-700">{label}</Text>
      <ChevronRight color="#586256" size={20} />
    </Pressable>
  );
}

function InputLabel({ label }: { label: string }) {
  return (
    <Text className="mb-2 mt-4 text-sm font-semibold text-gray-700">
      {label}
    </Text>
  );
}

function OptionGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-semibold text-gray-700">
        {title}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className={`rounded-full border px-4 py-2.5 ${
                selected
                  ? "border-[#586256] bg-[#586256]"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? "text-white" : "text-gray-700"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default ProfileScreen;
