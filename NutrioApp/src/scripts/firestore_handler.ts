import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from "@react-native-firebase/firestore";

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

const getUserProfileReference = (uid: string) =>
  doc(getFirestore(), "users", uid);

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