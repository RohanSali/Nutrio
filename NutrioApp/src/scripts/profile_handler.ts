import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from "@react-native-firebase/firestore";
import { getAuth, signOut } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export type Theme = "Light" | "Dark" | "System";
export type Units = "Metric" | "Imperial";
export type Language = "English" | "Hindi" | "Marathi";

export type UserBasicInfo = {
  name: string;
  height: number;
  weight: number;
  age: number;
  allergies: string[];
};

export type UserProfile = UserBasicInfo & {
  onboardingComplete: boolean;
  language?: Language;
  units?: Units;
  theme?: Theme;
};

const getUserProfileReference = (uid: string) =>
  doc(getFirestore(), "users", uid);

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const snapshot = await getDoc(getUserProfileReference(uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function ensureUserProfile(uid: string): Promise<void> {
  const reference = getUserProfileReference(uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(
    reference,
    {
      onboardingComplete: false,
      name: "",
      height: 0,
      weight: 0,
      age: 0,
      allergies: ["None"],
      language: "English",
      units: "Metric",
      theme: "System",
    },
    { merge: true }
  );
}

export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    getUserProfileReference(uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      onChange(snapshot.data() as UserProfile);
    },
    onError
  );
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    updates,
    { merge: true }
  );
}

export async function updateUserBasicInfo(
  uid: string,
  info: UserBasicInfo
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    {
      ...info,
      onboardingComplete: true,
    },
    { merge: true }
  );
}

export async function updateUserAllergies(
  uid: string,
  allergies: string[]
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    { allergies },
    { merge: true }
  );
}

export async function updateUserSettings(
  uid: string,
  settings: Pick<UserProfile, "language" | "units" | "theme">
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    settings,
    { merge: true }
  );
}

export async function deleteUserProfileData(uid: string): Promise<void> {
  // Keeps the Firebase Auth account but clears the profile document.
  await setDoc(
    getUserProfileReference(uid),
    {
      onboardingComplete: false,
      name: "",
      height: 0,
      weight: 0,
      age: 0,
      allergies: ["None"],
      language: "English",
      units: "Metric",
      theme: "System",
    },
    { merge: false }
  );
}

export async function logoutUser(): Promise<void> {
  // Firebase logout is the primary logout operation.
  await signOut(getAuth());

  // Google Sign-In maintains its own session.
  // A Google configuration error should not make Firebase logout fail.
  try {
    if (await GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.warn("Google sign-out skipped:", error);
  }
}
