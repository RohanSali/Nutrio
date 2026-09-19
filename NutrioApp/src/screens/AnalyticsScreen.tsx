import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  TriangleAlert,
} from "lucide-react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import { getAuth } from "@react-native-firebase/auth";

import {
  type AlternativeProduct,
  type ConstituentDetail,
  type ScanRecord,
  type UserProfile,
  subscribeToScanRecord,
  subscribeToUserProfile,
} from "../scripts/firestore_handler";

const BG = "#EAEEE3";
const CARD = "#FBF5EE";
const ACCENT = "#586256";
const TRACK = "#DCE1D5";
const HIGHLIGHT = "#FDE68A";

const SEMI_BOLD = { fontFamily: "Inter_18pt-SemiBold" } as const;
const LIGHT = { fontFamily: "Inter_24pt-Light" } as const;

const GRADE_COLORS: Record<string, string> = {
  A: "#3F9C5A",
  B: "#7FB539",
  C: "#E0A93B",
  D: "#E07B39",
  E: "#D24B41",
};

type ConstituentFilter = "all" | "additives" | "disease";

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();

  const scanId: string | undefined = route.params?.scanId;
  const uid = getAuth().currentUser?.uid;

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [constituentFilter, setConstituentFilter] =
    useState<ConstituentFilter>("all");
  const [expandedConstituent, setExpandedConstituent] = useState<string | null>(
    null
  );
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(
    null
  );

  const horizontalPadding = width < 360 ? 14 : width < 600 ? 18 : 24;
  const contentMaxWidth = width >= 600 ? 720 : 600;

  /* Hardware / gesture back always returns to the Dashboard. */
  useEffect(() => {
    const unsubscribe = navigation.addListener(
      "beforeRemove",
      (event: any) => {
        const type = event?.data?.action?.type;

        if (type === "GO_BACK" || type === "POP") {
          event.preventDefault();
          navigation.replace("Dashboard");
        }
      }
    );

    return unsubscribe;
  }, [navigation]);

  /* Scan document. */
  useEffect(() => {
    if (!scanId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToScanRecord(
      scanId,
      (nextScan) => {
        setScan(nextScan);
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Failed to load scan:", subscriptionError);
        setError("Unable to load this scan. Please check your connection.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [scanId]);

  /* User profile, only used to highlight the allergies the user is prone to. */
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeToUserProfile(
      uid,
      (nextProfile) => setProfile(nextProfile),
      (subscriptionError) =>
        console.error("Failed to load profile:", subscriptionError)
    );

    return unsubscribe;
  }, [uid]);

  const userAllergies = useMemo(() => {
    const list = profile?.allergies ?? [];

    return new Set(
      list
        .filter((item) => item.toLowerCase() !== "none")
        .map((item) => item.trim().toLowerCase())
    );
  }, [profile?.allergies]);

  const constituentEntries = useMemo(() => {
    const breakdown = scan?.constituentsBreakdown ?? {};

    return Object.entries(breakdown).map(([key, value]) => ({
      key,
      ...(value as ConstituentDetail),
    }));
  }, [scan?.constituentsBreakdown]);

  const visibleConstituents = useMemo(() => {
    if (constituentFilter === "additives") {
      return constituentEntries.filter((item) => item.isAdditive);
    }

    if (constituentFilter === "disease") {
      return constituentEntries.filter((item) => item.isDiseaseProne);
    }

    return constituentEntries;
  }, [constituentEntries, constituentFilter]);

  const goToDashboard = () => navigation.replace("Dashboard");

  const openFullImage = () => {
    if (!scan?.imageUrl) return;
    navigation.navigate("ImageViewer", { uri: scan.imageUrl });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#EAEEE3]">
        <ActivityIndicator size="large" color={ACCENT} />
        <Text className="mt-3 text-[14px] text-gray-500">
          Loading analysis…
        </Text>
      </SafeAreaView>
    );
  }

  if (!scanId || !scan || error) {
    return (
      <SafeAreaView className="flex-1 bg-[#EAEEE3]" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[22px] text-[#586256]" style={SEMI_BOLD}>
            {error ? "Something went wrong" : "No scan found"}
          </Text>
          <Text className="mt-2 text-center text-[15px] text-gray-500">
            {error ??
              "This analysis is not available anymore. Scan a label again to see its report."}
          </Text>
          <Pressable
            onPress={goToDashboard}
            className="mt-7 rounded-[24px] bg-[#586256] px-7 py-4"
          >
            <Text className="text-[16px] font-semibold text-white">
              Go to Dashboard
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const processing =
    scan.processingStatus === "pending" ||
    scan.processingStatus === "processing";

  const gaugeSize = Math.min((width - horizontalPadding * 2 - 60) / 2, 150);

  return (
    <SafeAreaView className="flex-1 bg-[#EAEEE3]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 40,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full" style={{ maxWidth: contentMaxWidth }}>
          {/* Header */}
          <View className="h-[70px] flex-row items-center">
            <Pressable
              onPress={goToDashboard}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#FBF5EE]"
              accessibilityRole="button"
              accessibilityLabel="Go back to dashboard"
            >
              <ChevronLeft color={ACCENT} size={28} strokeWidth={2.2} />
            </Pressable>

            <View className="ml-3 flex-1">
              <Text className="text-[26px] text-[#586256]" style={SEMI_BOLD}>
                Analytics
              </Text>
            </View>
          </View>

          {processing && (
            <View className="mb-1 mt-2 flex-row items-center rounded-[16px] border border-gray-200 bg-[#FBF5EE] px-4 py-3">
              <ActivityIndicator color={ACCENT} />
              <Text className="ml-3 flex-1 text-[14px] text-gray-600">
                Analysis is still processing. Results will update
                automatically.
              </Text>
            </View>
          )}

          {/* ---------------- Product ---------------- */}
          <View className="mt-4 rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-4">
            <View className="flex-row items-center">
              <Pressable
                onPress={openFullImage}
                className="h-[92px] w-[92px] overflow-hidden rounded-[16px] bg-gray-200"
              >
                {scan.imageUrl ? (
                  <Image
                    source={{ uri: scan.imageUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="text-[12px] text-gray-500">No image</Text>
                  </View>
                )}
              </Pressable>

              <View className="ml-4 flex-1">
                <VegBadge veg={scan.veg} />

                <Text className="mt-2 text-[13px] text-gray-500">
                  Food detected
                </Text>
                <Text
                  className="mt-0.5 text-[20px] text-[#586256]"
                  style={SEMI_BOLD}
                  numberOfLines={2}
                >
                  {scan.foodDetected || "--"}
                </Text>

                <Pressable
                  onPress={openFullImage}
                  className="mt-2 flex-row items-center"
                >
                  <Text className="text-[13px] text-[#586256]" style={LIGHT}>
                    View captured image
                  </Text>
                  <ChevronRight color={ACCENT} size={16} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ---------------- Scores ---------------- */}
          <SectionTitle title="SCORES" />

          <View className="rounded-[20px] border border-gray-200 bg-[#FBF5EE] px-4 py-5">
            <View className="flex-row items-start justify-around">
              <Gauge
                size={gaugeSize}
                label="Nutrients"
                value={scan.scores.nutrients}
              />
              <Gauge
                size={gaugeSize}
                label="Calories"
                value={scan.scores.calories}
              />
            </View>

            <View className="mt-6">
              <HealthImpactBar value={scan.scores.healthImpact} />
            </View>
          </View>

          {/* ---------------- Grade ---------------- */}
          <SectionTitle title="PRODUCT GRADE" />

          <View className="flex-row items-center rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-4">
            <View
              className="h-[72px] w-[72px] items-center justify-center rounded-full"
              style={{
                backgroundColor: scan.grade
                  ? `${GRADE_COLORS[scan.grade] ?? ACCENT}22`
                  : "#E5E7EB",
                borderWidth: 3,
                borderColor: scan.grade
                  ? GRADE_COLORS[scan.grade] ?? ACCENT
                  : "#CBD5C0",
              }}
            >
              <Text
                className="text-[32px]"
                style={[
                  SEMI_BOLD,
                  {
                    color: scan.grade
                      ? GRADE_COLORS[scan.grade] ?? ACCENT
                      : "#9CA3AF",
                  },
                ]}
              >
                {scan.grade ?? "–"}
              </Text>
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-[16px] text-[#586256]" style={SEMI_BOLD}>
                Product Grade : {scan.grade ?? "--"}
              </Text>
              <Text className="mt-1 text-[13px] text-gray-500">
                {gradeCaption(scan.grade)}
              </Text>
            </View>

            {/* Placeholder for the grade artwork. */}
            <View className="ml-3 h-[72px] w-[72px] items-center justify-center rounded-[16px] border border-dashed border-gray-300 bg-white/60">
              <Text className="text-center text-[10px] text-gray-400">
                Grade{"\n"}image
              </Text>
            </View>
          </View>

          {/* ---------------- Allergy check ---------------- */}
          <SectionTitle title="ALLERGY CHECK" />

          <View className="rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-4">
            {scan.allergiesDetected.length === 0 ? (
              <Text className="py-2 text-[14px] text-gray-500">
                No allergens were detected in this product.
              </Text>
            ) : (
              <>
                <Text className="mb-3 text-[13px] text-gray-500">
                  Allergens found in this product. Highlighted ones match your
                  profile.
                </Text>

                {scan.allergiesDetected.map((allergen) => {
                  const flagged = userAllergies.has(
                    allergen.trim().toLowerCase()
                  );

                  return (
                    <View
                      key={allergen}
                      className="mb-2 flex-row items-center rounded-[14px] border px-4 py-3"
                      style={{
                        backgroundColor: flagged ? HIGHLIGHT : "#FFFFFF",
                        borderColor: flagged ? "#F0B429" : "#E5E7EB",
                      }}
                    >
                      <Text
                        className="flex-1 text-[15px]"
                        style={{ color: flagged ? "#7C4A03" : "#374151" }}
                      >
                        {allergen}
                      </Text>

                      {flagged && (
                        <View className="flex-row items-center">
                          <TriangleAlert color="#B45309" size={16} />
                          <Text className="ml-1 text-[12px] font-semibold text-[#B45309]">
                            Your allergy
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* ---------------- Constituent analysis ---------------- */}
          <SectionTitle title="CONSTITUENT ANALYSIS" />

          <View className="rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-4">
            <View className="mb-3 flex-row flex-wrap gap-2">
              <FilterChip
                label="All constituents"
                active={constituentFilter === "all"}
                onPress={() => setConstituentFilter("all")}
              />
              <FilterChip
                label="Additives"
                active={constituentFilter === "additives"}
                onPress={() => setConstituentFilter("additives")}
              />
              <FilterChip
                label="Disease prone"
                active={constituentFilter === "disease"}
                onPress={() => setConstituentFilter("disease")}
              />
            </View>

            {visibleConstituents.length === 0 ? (
              <Text className="py-4 text-center text-[14px] text-gray-400">
                Nothing to show for this filter.
              </Text>
            ) : (
              visibleConstituents.map((item) => {
                const expanded = expandedConstituent === item.key;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      setExpandedConstituent(expanded ? null : item.key)
                    }
                    className="mb-2 rounded-[14px] border border-gray-200 bg-white px-4 py-3"
                  >
                    <View className="flex-row items-center">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center">
                          <Text
                            className="text-[15px] text-[#586256]"
                            style={SEMI_BOLD}
                          >
                            {item.name || item.key}
                          </Text>

                          {!!item.level && (
                            <Text className="ml-2 text-[13px] text-gray-500">
                              · {item.level}
                            </Text>
                          )}
                        </View>

                        <Text
                          className="mt-1 text-[13px] text-gray-600"
                          numberOfLines={expanded ? undefined : 1}
                        >
                          {item.summary || "No summary available."}
                        </Text>
                      </View>

                      <ChevronDown
                        color={ACCENT}
                        size={20}
                        style={{
                          transform: [
                            { rotate: expanded ? "180deg" : "0deg" },
                          ],
                        }}
                      />
                    </View>

                    {expanded && (
                      <View className="mt-3 rounded-[12px] bg-[#EAEEE3] p-3">
                        <Text className="text-[13px] leading-[20px] text-gray-700">
                          {item.details || "No detailed description available."}
                        </Text>

                        {(item.isAdditive ||
                          item.isDiseaseProne ||
                          !!item.conditions?.length) && (
                          <View className="mt-3 flex-row flex-wrap gap-2">
                            {item.isAdditive && <Tag label="Additive" />}
                            {item.isDiseaseProne && (
                              <Tag label="Disease prone" tone="warn" />
                            )}
                            {item.conditions?.map((condition) => (
                              <Tag
                                key={condition}
                                label={condition}
                                tone="warn"
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>

          {/* ---------------- Alternatives ---------------- */}
          <SectionTitle title="ALTERNATIVE PRODUCTS" />

          <View className="rounded-[20px] border border-gray-200 bg-[#FBF5EE] p-4">
            {scan.alternativeProducts.length === 0 ? (
              <Text className="py-2 text-[14px] text-gray-500">
                No alternatives suggested for this product.
              </Text>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {scan.alternativeProducts.map((product, index) => (
                    <AlternativeTile
                      key={`${product.name}-${index}`}
                      product={product}
                      selected={selectedAlternative === index}
                      onPress={() =>
                        setSelectedAlternative(
                          selectedAlternative === index ? null : index
                        )
                      }
                    />
                  ))}
                </ScrollView>

                {selectedAlternative !== null &&
                  !!scan.alternativeProducts[selectedAlternative] && (
                    <AlternativeDetails
                      product={scan.alternativeProducts[selectedAlternative]}
                    />
                  )}

                {selectedAlternative === null && (
                  <Text className="mt-3 text-[12px] text-gray-400">
                    Tap a product to see why it is a better choice.
                  </Text>
                )}
              </>
            )}
          </View>

          <Pressable
            onPress={goToDashboard}
            className="mt-7 h-14 items-center justify-center rounded-2xl bg-[#586256]"
          >
            <Text className="text-[16px] font-semibold text-white">
              Back to Dashboard
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Gauge + bar                                                         */
/* ------------------------------------------------------------------ */

function scoreColor(value: number | null): string {
  if (value === null) return "#9CA3AF";
  if (value < 40) return "#D24B41";
  if (value < 70) return "#E0A93B";
  return "#3F9C5A";
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (Math.PI / 180) * angleDeg;

  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function Gauge({
  size,
  label,
  value,
}: {
  size: number;
  label: string;
  value: number | null;
}) {
  const width = size;
  const stroke = Math.max(10, size * 0.09);
  const cx = width / 2;
  const r = width / 2 - stroke / 2 - 2;
  const cy = r + stroke / 2 + 2;
  const height = cy + stroke / 2 + 6;

  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));
  const angle = 180 - (safeValue / 100) * 180;
  const color = scoreColor(value);

  const needle = polarPoint(cx, cy, r * 0.74, value === null ? 180 : angle);

  return (
    <View className="items-center">
      <Svg width={width} height={height}>
        <Path
          d={arcPath(cx, cy, r, 180, 0)}
          stroke={TRACK}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />

        {value !== null && safeValue > 0 && (
          <Path
            d={arcPath(cx, cy, r, 180, angle)}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}

        <Path
          d={`M ${cx} ${cy} L ${needle.x} ${needle.y}`}
          stroke={ACCENT}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx={cx} cy={cy} r={5} fill={ACCENT} />
      </Svg>

      <Text className="mt-1 text-[20px]" style={[SEMI_BOLD, { color }]}>
        {value === null ? "--" : Math.round(value)}
      </Text>
      <Text className="text-[14px] text-gray-600">{label}</Text>
    </View>
  );
}

function HealthImpactBar({ value }: { value: number | null }) {
  const [barWidth, setBarWidth] = useState(0);

  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));
  const height = 52;
  const barY = 6;
  const barHeight = 18;
  const markerX =
    barWidth > 0 ? Math.max(10, Math.min(barWidth - 10, (safeValue / 100) * barWidth)) : 0;

  return (
    <View>
      <View
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={{ width: "100%", height }}
      >
        {barWidth > 0 && (
          <Svg width={barWidth} height={height}>
            <Defs>
              <LinearGradient id="healthImpact" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#D24B41" />
                <Stop offset="0.35" stopColor="#E0A93B" />
                <Stop offset="0.65" stopColor="#A7C957" />
                <Stop offset="1" stopColor="#3F9C5A" />
              </LinearGradient>
            </Defs>

            <Rect
              x={0}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx={barHeight / 2}
              fill="url(#healthImpact)"
              opacity={value === null ? 0.35 : 1}
            />

            {value !== null && (
              <Polygon
                points={`${markerX},${barY + barHeight + 2} ${markerX - 8},${
                  barY + barHeight + 18
                } ${markerX + 8},${barY + barHeight + 18}`}
                fill={ACCENT}
              />
            )}
          </Svg>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-gray-500">Bad</Text>
        <Text className="text-[15px] text-[#586256]" style={SEMI_BOLD}>
          Health Impact {value === null ? "--" : Math.round(value)}
        </Text>
        <Text className="text-[13px] text-gray-500">Good</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-7 px-1 text-[13px] font-semibold tracking-wider text-[#586256]">
      {title}
    </Text>
  );
}

function VegBadge({ veg }: { veg: boolean | null }) {
  if (veg === null) {
    return (
      <View className="flex-row items-center self-start rounded-full border border-gray-300 bg-white px-3 py-1">
        <View className="h-3 w-3 rounded-sm border border-gray-400" />
        <Text className="ml-2 text-[12px] font-semibold text-gray-500">
          Unknown
        </Text>
      </View>
    );
  }

  const color = veg ? "#3F9C5A" : "#B91C1C";

  return (
    <View
      className="flex-row items-center self-start rounded-full bg-white px-3 py-1"
      style={{ borderWidth: 1, borderColor: color }}
    >
      <View
        className="h-3.5 w-3.5 items-center justify-center rounded-sm"
        style={{ borderWidth: 1.5, borderColor: color }}
      >
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </View>
      <Text
        className="ml-2 text-[12px] font-semibold"
        style={{ color }}
      >
        {veg ? "Veg" : "Non-veg"}
      </Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        active ? "border-[#586256] bg-[#586256]" : "border-gray-200 bg-white"
      }`}
    >
      <Text
        className={`text-[13px] font-medium ${
          active ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Tag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "warn";
}) {
  const warn = tone === "warn";

  return (
    <View
      className="rounded-full px-3 py-1"
      style={{
        backgroundColor: warn ? "#FEF3C7" : "#FFFFFF",
        borderWidth: 1,
        borderColor: warn ? "#F0B429" : "#E5E7EB",
      }}
    >
      <Text
        className="text-[11px] font-semibold"
        style={{ color: warn ? "#B45309" : ACCENT }}
      >
        {label}
      </Text>
    </View>
  );
}

function AlternativeTile({
  product,
  selected,
  onPress,
}: {
  product: AlternativeProduct;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="w-[88px] items-center">
      <View
        className="h-[80px] w-[80px] overflow-hidden rounded-[16px] bg-gray-200"
        style={{
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? ACCENT : "#E5E7EB",
        }}
      >
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-[#EAEEE3]">
            <Text className="text-[22px] text-[#586256]" style={SEMI_BOLD}>
              {product.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text
        className="mt-1.5 text-center text-[12px] text-gray-700"
        numberOfLines={2}
      >
        {product.name}
      </Text>
    </Pressable>
  );
}

function AlternativeDetails({ product }: { product: AlternativeProduct }) {
  return (
    <View className="mt-4 rounded-[16px] bg-[#EAEEE3] p-4">
      <View className="flex-row items-center">
        <Text
          className="flex-1 pr-3 text-[16px] text-[#586256]"
          style={SEMI_BOLD}
        >
          {product.name}
        </Text>

        {!!product.grade && (
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${
                GRADE_COLORS[String(product.grade)] ?? ACCENT
              }22`,
              borderWidth: 2,
              borderColor: GRADE_COLORS[String(product.grade)] ?? ACCENT,
            }}
          >
            <Text
              className="text-[14px]"
              style={[
                SEMI_BOLD,
                { color: GRADE_COLORS[String(product.grade)] ?? ACCENT },
              ]}
            >
              {product.grade}
            </Text>
          </View>
        )}
      </View>

      <Text className="mt-2 text-[13px] leading-[20px] text-gray-700">
        {product.reason || "No comparison details available."}
      </Text>

      {!!product.highlights?.length && (
        <View className="mt-3">
          {product.highlights.map((highlight) => (
            <View key={highlight} className="mb-1 flex-row items-start">
              <Text className="mr-2 text-[13px] text-[#586256]">•</Text>
              <Text className="flex-1 text-[13px] text-gray-700">
                {highlight}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function gradeCaption(grade: string | null): string {
  switch (grade) {
    case "A":
      return "Excellent choice for regular consumption.";
    case "B":
      return "Good, with a few things worth watching.";
    case "C":
      return "Average. Fine occasionally, not daily.";
    case "D":
      return "Poor. Better alternatives are available.";
    case "E":
      return "Best avoided. High risk constituents found.";
    default:
      return "Grade not available yet.";
  }
}

export default AnalyticsScreen;