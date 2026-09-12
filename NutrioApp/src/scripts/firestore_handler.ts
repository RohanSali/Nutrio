import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, type FirestoreError, type Unsubscribe } from "@react-native-firebase/firestore";
import { getAuth, signOut } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export type Theme = "Light" | "Dark" | "System";
export type Units = "Metric" | "Imperial";
export type Language = "English" | "Hindi" | "Marathi";
export type UserProfile = {
  onboardingComplete: boolean;
};

export type UserBasicInfo = {
  name: string;
  height: number;
  weight: number;
  age: number;
  allergies: string[];
};

export type ScanRecord = {
  userId: string;
  imageUrl: string;
  scores: {
    calories: number | null;
    nutrients: number | null;
    healthImpact: number | null;
  };
  grade: string | null;
  allergiesDetected: string[];
  alternativeProducts: string[];
  processedFindings: string[];
};

const getUserProfileReference = (uid: string) =>
  doc(getFirestore(), "users", uid);

const getScanReference = (scanId: string) =>
  doc(getFirestore(), "scans", scanId);

const getScanHistoryReference = (uid: string, scanId: string) =>
  doc(getFirestore(), "history", uid, "scans", scanId);

export async function createScanRecord(
  uid: string,
  scanId: string,
  imageUrl: string
): Promise<void> {
  const scan: ScanRecord = {
    userId: uid,
    imageUrl,
    scores: {
      calories: null,
      nutrients: null,
      healthImpact: null,
    },
    grade: null,
    allergiesDetected: [],
    alternativeProducts: [],
    processedFindings: [],
  };

  await setDoc(getScanReference(scanId), scan);
  await setDoc(getScanHistoryReference(uid, scanId), {
    scanId,
    timestamp: serverTimestamp(),
  });
}

export async function ensureUserProfile(uid: string): Promise<void> {
  const reference = getUserProfileReference(uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(
    reference,
    { onboardingComplete: false },
    { merge: true }
  );
}

export async function setOnboardingComplete(
  uid: string,
  onboardingComplete: boolean
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    { onboardingComplete },
    { merge: true }
  );
}

export async function saveUserBasicInfo(
  uid: string,
  info: UserBasicInfo
): Promise<void> {
  await setDoc(
    getUserProfileReference(uid),
    { ...info, onboardingComplete: true },
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

export function subscribeToOnboardingStatus(
  uid: string,
  onChange: (onboardingComplete: boolean) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    getUserProfileReference(uid),
    async (snapshot) => {
      if (!snapshot.exists()) {
        await ensureUserProfile(uid);
        onChange(false);
        return;
      }

      onChange(snapshot.data()?.onboardingComplete === true);
    },
    onError
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