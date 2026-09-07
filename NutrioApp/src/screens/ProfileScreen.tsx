import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { getAuth, signOut } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { LogOut, UserRound } from "lucide-react-native";

export function ProfileScreen() {
  const [loggingOut, setLoggingOut] = useState(false);
  const user = getAuth().currentUser;
  const name = user?.displayName || "Nutrio user";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);

    try {
      await signOut(getAuth());

      // Firebase and Google maintain separate sessions.
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch {
      Alert.alert("Unable to log out", "Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900">Your Profile</Text>
      <Text className="mt-2 text-base text-gray-500">
        Manage your account details
      </Text>

      <View className="mt-10 items-center">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-500">
          {initials ? (
            <Text className="text-3xl font-bold text-white">{initials}</Text>
          ) : (
            <UserRound color="white" size={36} />
          )}
        </View>
        <Text className="mt-4 text-2xl font-bold text-gray-900">{name}</Text>
        <Text className="mt-1 text-base text-gray-500">{user?.email}</Text>
      </View>

      <View className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <Text className="text-xs font-semibold uppercase text-gray-500">
          Account
        </Text>
        <Text className="mt-2 text-base text-gray-900">{user?.email}</Text>
      </View>

      <Pressable
        className="mt-auto mb-10 h-14 flex-row items-center justify-center rounded-2xl bg-black"
        disabled={loggingOut}
        onPress={handleLogout}
      >
        {loggingOut ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <LogOut color="white" size={18} />
            <Text className="ml-2 text-base font-semibold text-white">
              Log out
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

export default ProfileScreen;