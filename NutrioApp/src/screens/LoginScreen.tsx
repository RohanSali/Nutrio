import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Svg, { Path } from "react-native-svg";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { ensureUserProfile } from "../scripts/firestore_handler";

GoogleSignin.configure({
  webClientId: "84798314876-4psmao69rp1l6olk5m4nrndfsgfnbhpr.apps.googleusercontent.com",
  offlineAccess: true,
});

export function LoginScreen() {
  // Email + password state
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);

  // Loading flags (kept separate so one spinner doesn't disable every button)
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const friendlyErrorMessage = (error: any, fallback: string): string => {
    switch (error?.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account exists with this email.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "An account already exists with this email.";
      case "auth/weak-password":
        return "Please choose a stronger password.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again later.";
      default:
        return fallback;
    }
  };

  // ---------- Email / password ----------
  const handleEmailAuth = async (): Promise<void> => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    if (!password) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters."
      );
      return;
    }

    if (isCreatingAccount && password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter your password.");
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();

      if (isCreatingAccount) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        await ensureUserProfile(credential.user.uid);
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (error: any) {
      Alert.alert(
        isCreatingAccount ? "Unable to create account" : "Unable to sign in",
        friendlyErrorMessage(error, "Something went wrong. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- Google ----------
  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Firebase logout does not clear Google's cached account.
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }

      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        return;
      }

      const { idToken } = result.data;

      if (!idToken) {
        throw new Error("Google sign-in did not return an ID token.");
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const credential = await signInWithCredential(getAuth(), googleCredential);
      await ensureUserProfile(credential.user.uid);
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      let message = "Something went wrong. Please try again.";

      if (error?.code === statusCodes.IN_PROGRESS) {
        message = "A sign-in is already in progress.";
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        message = "Google Play Services is unavailable or outdated.";
      } else if (error?.code === "DEVELOPER_ERROR" || error?.code === 10) {
        message =
          "Google sign-in isn't configured correctly (mismatched SHA-1 fingerprint or webClientId). Check the Firebase console setup.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Unable to sign in with Google", message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const anyLoading = loading || googleLoading;

  return (
    <KeyboardAwareScrollView className="flex-1 bg-[#EAEEE3]" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" enableOnAndroid enableAutomaticScroll extraScrollHeight={24} keyboardOpeningTime={0}>
      <View className="flex-1 justify-center px-6 py-12">
        {/* App Logo */}
        <View className="mb-8 items-center">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl bg-[#586256]">
            <Text className="text-3xl font-bold text-white">N</Text>
          </View>
          <Text className="text-3xl font-bold text-[#586256]">Welcome back</Text>
          <Text className="mt-2 text-center text-base text-gray-600">{isCreatingAccount ? "Create your account to get started" : "Sign in to continue"}</Text>
        </View>

        <View>
          {/* Google Sign In */}
          <Pressable onPress={handleGoogleSignIn} disabled={anyLoading} className="mb-5 h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-[#FBF5EE]">
            {googleLoading ? <ActivityIndicator color="#586256" /> : <>
              <Svg width={20} height={20} viewBox="0 0 48 48">
                <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-.792,2.237-2.231,4.166-4.087,5.571c.001-.001,0.002-.001,0.003-.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </Svg>
              <Text className="text-base font-semibold text-gray-800">Continue with Google</Text>
            </>}
          </Pressable>

          <View className="mb-5 flex-row items-center"><View className="h-px flex-1 bg-gray-300" /><Text className="mx-3 text-xs font-medium text-gray-500">OR</Text><View className="h-px flex-1 bg-gray-300" /></View>

          {/* Email */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-[#586256]">Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!anyLoading} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 text-base text-gray-900" />
          </View>

          {/* Password */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-[#586256]">Password</Text>
            <View className="relative justify-center">
              <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} editable={!anyLoading} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 pr-12 text-base text-gray-900" />
              <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10} className="absolute right-4"><Text className="text-sm font-medium text-gray-500">{showPassword ? "Hide" : "Show"}</Text></Pressable>
            </View>
          </View>

          {isCreatingAccount && <View className="mb-7"><Text className="mb-2 text-sm font-semibold text-[#586256]">Confirm Password</Text><View className="relative justify-center"><TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" placeholderTextColor="#9CA3AF" secureTextEntry={!showConfirmPassword} autoCapitalize="none" autoCorrect={false} editable={!anyLoading} className="h-14 rounded-2xl border border-gray-200 bg-[#FBF5EE] px-4 pr-12 text-base text-gray-900" /><Pressable onPress={() => setShowConfirmPassword((value) => !value)} hitSlop={10} className="absolute right-4"><Text className="text-sm font-medium text-gray-500">{showConfirmPassword ? "Hide" : "Show"}</Text></Pressable></View></View>}
          {!isCreatingAccount && <View className="mb-7" />}

          <Pressable onPress={handleEmailAuth} disabled={anyLoading} className={`h-14 items-center justify-center rounded-2xl ${anyLoading ? "bg-gray-400" : "bg-[#586256]"}`}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-base font-semibold text-white">{isCreatingAccount ? "Create Account" : "Sign In"}</Text>}
          </Pressable>

          <View className="mt-7 flex-row items-center justify-center"><Text className="text-sm text-gray-600">{isCreatingAccount ? "Already have an account?" : "Don't have an account?"}</Text><Pressable onPress={() => { setIsCreatingAccount((value) => !value); setConfirmPassword(""); setShowConfirmPassword(false); }} disabled={anyLoading} className="ml-1"><Text className="text-sm font-semibold text-[#586256]">{isCreatingAccount ? "Sign In" : "Create one"}</Text></Pressable></View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

export default LoginScreen;