import {
  doc,
  collection,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from "@react-native-firebase/firestore";
import { getAuth, signOut } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export type Theme = "Light" | "Dark" | "System";
export type Units = "Metric" | "Imperial";
export type Language = "English" | "Hindi" | "Marathi";

export type UserProfile = {
  onboardingComplete: boolean;
  name: string;
  height: number;
  weight: number;
  age: number;
  allergies: string[];
  language: Language;
  units: Units;
  theme: Theme;
};

export type UserBasicInfo = {
  name: string;
  height: number;
  weight: number;
  age: number;
  allergies: string[];
};

export type Grade = "A" | "B" | "C" | "D" | "E";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed";

export type ScanScores = {
  calories: number | null;
  nutrients: number | null;
  healthImpact: number | null;
};

/**
 * One entry of `constituentsBreakdown`. The map key is the constituent name
 * (e.g. "Sodium", "INS 211"), so `name` is only needed when a prettier label
 * than the key is available.
 */
export type ConstituentDetail = {
  name?: string;
  /** Measured amount / level, e.g. "820 mg", "High". */
  level?: string | null;
  /** One line shown in the collapsed row. */
  summary: string;
  /** Long form shown when the row is expanded. */
  details: string;
  /** Marks the constituent as an additive / preservative / colour. */
  isAdditive?: boolean;
  /** Marks the constituent as risky for a known health condition. */
  isDiseaseProne?: boolean;
  /** Optional condition tags, e.g. ["Diabetes", "Hypertension"]. */
  conditions?: string[];
};

export type ConstituentsBreakdown = Record<string, ConstituentDetail>;

export type AlternativeProduct = {
  name: string;
  imageUrl?: string | null;
  grade?: Grade | string | null;
  /** Why this product is better than the scanned one. */
  reason: string;
  /** Short bullet points shown under the reason. */
  highlights?: string[];
};

export type ScanRecord = {
  userId: string;
  veg: boolean | null;
  foodDetected: string | null;
  imageUrl: string;
  scores: ScanScores;
  grade: Grade | null;
  allergiesDetected: string[];
  constituentsBreakdown: ConstituentsBreakdown;
  alternativeProducts: AlternativeProduct[];
  processingStatus: ProcessingStatus | null;
};

export type ScanLog = {
  scanId: string;
  timestamp: Date | null;
  scan: ScanRecord | null;
};

/* References */
const getUserProfileReference = (uid: string) =>
  doc(getFirestore(), "users", uid);

const getScanReference = (scanId: string) =>
  doc(getFirestore(), "scans", scanId);

const getScanHistoryReference = (uid: string, scanId: string) =>
  doc(getFirestore(), "history", uid, "scans", scanId);


/* Scan normalisation */
export const EMPTY_SCORES: ScanScores = {
  calories: null,
  nutrients: null,
  healthImpact: null,
};

const toNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const normalizeConstituents = (value: unknown): ConstituentsBreakdown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: ConstituentsBreakdown = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    // A constituent written as a plain string is treated as its summary.
    if (typeof raw === "string") {
      result[key] = { summary: raw, details: raw };
      return;
    }

    if (!raw || typeof raw !== "object") return;

    const entry = raw as Record<string, unknown>;

    const summary =
      typeof entry.summary === "string"
        ? entry.summary
        : typeof entry.description === "string"
        ? entry.description
        : "";

    const details =
      typeof entry.details === "string"
        ? entry.details
        : typeof entry.detailedDescription === "string"
        ? entry.detailedDescription
        : summary;

    result[key] = {
      name: typeof entry.name === "string" ? entry.name : undefined,
      level:
        typeof entry.level === "string" || typeof entry.level === "number"
          ? String(entry.level)
          : null,
      summary,
      details,
      isAdditive: entry.isAdditive === true,
      isDiseaseProne: entry.isDiseaseProne === true,
      conditions: toStringArray(entry.conditions),
    };
  });

  return result;
};

const normalizeAlternatives = (value: unknown): AlternativeProduct[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): AlternativeProduct | null => {
      // Tolerates older documents where alternatives were plain names.
      if (typeof raw === "string") {
        return { name: raw, imageUrl: null, grade: null, reason: "" };
      }

      if (!raw || typeof raw !== "object") return null;

      const entry = raw as Record<string, unknown>;
      const name = typeof entry.name === "string" ? entry.name : "";

      if (!name) return null;

      return {
        name,
        imageUrl:
          typeof entry.imageUrl === "string" ? entry.imageUrl : null,
        grade: typeof entry.grade === "string" ? entry.grade : null,
        reason: typeof entry.reason === "string" ? entry.reason : "",
        highlights: toStringArray(entry.highlights),
      };
    })
    .filter((item): item is AlternativeProduct => item !== null);
};

/** Converts a raw Firestore document into a fully populated ScanRecord. */
export function normalizeScanRecord(raw: unknown): ScanRecord {
  const data = (raw ?? {}) as Record<string, any>;

  return {
    userId: typeof data.userId === "string" ? data.userId : "",
    veg: typeof data.veg === "boolean" ? data.veg : null,
    foodDetected:
      typeof data.foodDetected === "string" ? data.foodDetected : null,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    scores: {
      calories: toNumberOrNull(data.scores?.calories),
      nutrients: toNumberOrNull(data.scores?.nutrients),
      healthImpact: toNumberOrNull(data.scores?.healthImpact),
    },
    grade: typeof data.grade === "string" ? (data.grade as Grade) : null,
    allergiesDetected: toStringArray(data.allergiesDetected),
    constituentsBreakdown: normalizeConstituents(data.constituentsBreakdown),
    alternativeProducts: normalizeAlternatives(data.alternativeProducts),
    processingStatus:
      typeof data.processingStatus === "string"
        ? (data.processingStatus as ProcessingStatus)
        : null,
  };
}



/* Scans */
export async function createScanRecord(
  uid: string,
  scanId: string,
  imageUrl: string,
  results?: Partial<
    Pick<
      ScanRecord,
      | "veg"
      | "foodDetected"
      | "scores"
      | "grade"
      | "allergiesDetected"
      | "constituentsBreakdown"
      | "alternativeProducts"
      | "processingStatus"
    >
  >
): Promise<void> {
  const scan: ScanRecord = {
    userId: uid,
    veg: results?.veg ?? null,
    foodDetected: results?.foodDetected ?? null,
    imageUrl,
    scores: results?.scores ?? { ...EMPTY_SCORES },
    grade: results?.grade ?? null,
    allergiesDetected: results?.allergiesDetected ?? [],
    constituentsBreakdown: results?.constituentsBreakdown ?? {},
    alternativeProducts: results?.alternativeProducts ?? [],
    processingStatus: results?.processingStatus ?? "pending",
  };

  await setDoc(getScanReference(scanId), scan);
  await setDoc(getScanHistoryReference(uid, scanId), {
    scanId,
    timestamp: serverTimestamp(),
  });
}

/** Merges analysis results into an existing scan document. */
export async function updateScanRecord(
  scanId: string,
  updates: Partial<ScanRecord>
): Promise<void> {
  await setDoc(getScanReference(scanId), updates, { merge: true });
}

export async function getScanRecord(
  scanId: string
): Promise<ScanRecord | null> {
  const snapshot = await getDoc(getScanReference(scanId));

  return snapshot.exists() ? normalizeScanRecord(snapshot.data()) : null;
}

export function subscribeToScanRecord(
  scanId: string,
  onChange: (scan: ScanRecord | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    getScanReference(scanId),
    (snapshot) => {
      onChange(
        snapshot.exists() ? normalizeScanRecord(snapshot.data()) : null
      );
    },
    onError
  );
}

/* User profile */
export async function ensureUserProfile(uid: string): Promise<void> {
  const reference = getUserProfileReference(uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(reference, { onboardingComplete: false }, { merge: true });
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
  await setDoc(getUserProfileReference(uid), { allergies }, { merge: true });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await setDoc(getUserProfileReference(uid), updates, { merge: true });
}

export async function updateUserSettings(
  uid: string,
  settings: Pick<UserProfile, "language" | "units" | "theme">
): Promise<void> {
  await setDoc(getUserProfileReference(uid), settings, { merge: true });
}

export function subscribeToUserScanHistory(
  uid: string,
  onChange: (logs: ScanLog[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const historyReference = collection(getFirestore(), "history", uid, "scans");
  const historyQuery = query(historyReference, orderBy("timestamp", "desc"));

  return onSnapshot(
    historyQuery,
    async (snapshot) => {
      try {
        const logs = await Promise.all(
          snapshot.docs.map(async (historySnapshot) => {
            const data = historySnapshot.data() as {
              scanId?: string;
              timestamp?: { toDate?: () => Date } | Date | null;
            };
            const scanId = data.scanId ?? historySnapshot.id;
            const timestamp =
              data.timestamp && "toDate" in data.timestamp && data.timestamp.toDate
                ? data.timestamp.toDate()
                : data.timestamp instanceof Date
                  ? data.timestamp
                  : null;

            return {
              scanId,
              timestamp,
              scan: await getScanRecord(scanId),
            };
          })
        );

        onChange(logs);
      } catch (error) {
        onError(error as FirestoreError);
      }
    },
    onError
  );
}