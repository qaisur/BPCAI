import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

interface VisitData {
  id: number;
  visitDate: string;
  visitType: string;
  intervention?: string;
  nextFollowUpDate?: string;
  surgeonName: string;
  hscAmsScore: any;
  malletScore: any;
  clinicalExam: any;
}

interface PatientRecord {
  patient: any;
  visits: VisitData[];
}

function calculateAge(dob: string, atDate?: string) {
  const birth = new Date(dob);
  const ref = atDate ? new Date(atDate) : new Date();
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    days += 30;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}Y ${months}M ${days}D`;
}

function formatDate(d: string) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function DataTableRow({
  label,
  values,
  isHeader = false,
}: {
  label: string;
  values: string[];
  isHeader?: boolean;
}) {
  return (
    <View style={[tableStyles.row, isHeader && tableStyles.headerRow]}>
      <View style={tableStyles.labelCell}>
        <Text
          style={[
            tableStyles.labelText,
            isHeader && tableStyles.headerText,
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
      {values.map((val, idx) => (
        <View key={idx} style={tableStyles.valueCell}>
          <Text
            style={[
              tableStyles.valueText,
              isHeader && tableStyles.headerText,
            ]}
          >
            {val ?? "-"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DataTableSubRow({
  label,
  subLabel,
  values,
}: {
  label: string;
  subLabel: string;
  values: string[];
}) {
  return (
    <View style={tableStyles.row}>
      <View style={tableStyles.labelCell}>
        <Text style={tableStyles.groupLabel}>{label}</Text>
        <Text style={tableStyles.subLabel}>{subLabel}</Text>
      </View>
      {values.map((val, idx) => (
        <View key={idx} style={tableStyles.valueCell}>
          <Text style={tableStyles.valueText}>{val ?? "-"}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [activeTab, setActiveTab] = useState<
    "info" | "hscams" | "mallet" | "clinical"
  >("info");

  const {
    data: record,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PatientRecord>({
    queryKey: [`/api/patients/${id}/full-record`],
  });

  const patient = record?.patient;
  const visitsList = record?.visits || [];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + webTopInset }]}>
        <Text style={styles.errorText}>Patient not found</Text>
      </View>
    );
  }

  const visitDates = visitsList.map((v) => formatDate(v.visitDate));
  const visitAges = visitsList.map((v) =>
    calculateAge(patient.dateOfBirth, v.visitDate)
  );

  function renderInfoTab() {
    return (
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Patient Details</Text>
          <InfoRow label="Patient ID" value={patient.patientId} />
          <InfoRow label="Name" value={patient.childName} />
          <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
          <InfoRow label="Gender" value={patient.gender} />
          <InfoRow label="Father" value={patient.fatherName} />
          <InfoRow label="Mother" value={patient.motherName} />
          <InfoRow label="Contact" value={patient.contactNumber} />
          <InfoRow label="Address" value={patient.address} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Birth History</Text>
          <InfoRow label="Gestational Age" value={patient.gestationalAge ? `${patient.gestationalAge} wk` : null} />
          <InfoRow label="No. of Delivery" value={patient.numberOfDelivery} />
          <InfoRow label="Presentation" value={patient.presentationOfChild} />
          <InfoRow label="Gest. Diabetes" value={patient.gestationalDiabetes} />
          <InfoRow label="Type of Delivery" value={patient.typeOfDelivery} />
          <InfoRow label="Mode of Delivery" value={patient.modeOfDelivery} />
          <InfoRow label="Birth Weight" value={patient.birthWeight ? `${patient.birthWeight} kg` : null} />
          <InfoRow label="Sibling Birth Wt." value={patient.birthWeightOfSiblings} />
          <InfoRow label="Shoulder Dystocia" value={patient.shoulderDystocia} />
          <InfoRow label="Difficult Delivery" value={patient.difficultDelivery} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Family History</Text>
          <InfoRow label="Sibling Affection" value={patient.siblingAffection} />
          <InfoRow label="Assoc. Features at Birth" value={patient.associatedFeaturesAtBirth} />
          <InfoRow label="Involvement" value={patient.involvement} />
          <InfoRow label="Assoc. Features" value={patient.associatedFeatures} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>
            Visit History ({visitsList.length})
          </Text>
          {visitsList.length === 0 ? (
            <Text style={styles.noDataText}>No visits recorded</Text>
          ) : (
            visitsList.map((visit, idx) => (
              <View key={visit.id} style={styles.visitRow}>
                <View style={styles.visitDot} />
                <View style={styles.visitInfo}>
                  <Text style={styles.visitDate}>
                    {formatDate(visit.visitDate)}
                  </Text>
                  <Text style={styles.visitMeta}>
                    {visit.visitType} | Dr. {visit.surgeonName}
                  </Text>
                  {visit.intervention && (
                    <Text style={styles.visitIntervention}>
                      Intervention/Note: {visit.intervention}
                    </Text>
                  )}
                  {visit.nextFollowUpDate && (
                    <Text style={styles.visitFollowUp}>
                      Next Follow-up: {formatDate(visit.nextFollowUpDate)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  }

  function renderHscAmsTab() {
    const visitsWithScores = visitsList.filter((v) => v.hscAmsScore);
    if (visitsWithScores.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="document-text-outline" size={40} color={Colors.textLight} />
          <Text style={styles.noDataText}>No HSC AMS scores recorded</Text>
        </View>
      );
    }

    const dates = visitsWithScores.map((v) => formatDate(v.visitDate));
    const ages = visitsWithScores.map((v) =>
      calculateAge(patient.dateOfBirth, v.visitDate)
    );
    const scores = visitsWithScores.map((v) => v.hscAmsScore);
    const interventions = visitsWithScores.map((v) => v.intervention || "-");

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={tableStyles.table}>
          <DataTableRow label="Date" values={dates} isHeader />
          <DataTableRow label="Age of Pt" values={ages} />
          <DataTableRow label="Intervention/Note" values={interventions} />
          <DataTableSubRow label="Shoulder" subLabel="Abduction" values={scores.map((s: any) => String(s.shoulderAbduction ?? "-"))} />
          <DataTableSubRow label="" subLabel="Adduction" values={scores.map((s: any) => String(s.shoulderAdduction ?? "-"))} />
          <DataTableSubRow label="" subLabel="F Flexion" values={scores.map((s: any) => String(s.shoulderFFlexion ?? "-"))} />
          <DataTableSubRow label="" subLabel="ER" values={scores.map((s: any) => String(s.shoulderER ?? "-"))} />
          <DataTableSubRow label="" subLabel="IR" values={scores.map((s: any) => String(s.shoulderIR ?? "-"))} />
          <DataTableSubRow label="Elbow" subLabel="Flexion" values={scores.map((s: any) => String(s.elbowFlexion ?? "-"))} />
          <DataTableSubRow label="" subLabel="Extension" values={scores.map((s: any) => String(s.elbowExtension ?? "-"))} />
          <DataTableSubRow label="Forearm" subLabel="Supination" values={scores.map((s: any) => String(s.forearmSupination ?? "-"))} />
          <DataTableSubRow label="" subLabel="Pronation" values={scores.map((s: any) => String(s.forearmPronation ?? "-"))} />
          <DataTableSubRow label="Wrist" subLabel="Flexion" values={scores.map((s: any) => String(s.wristFlexion ?? "-"))} />
          <DataTableSubRow label="" subLabel="Extension" values={scores.map((s: any) => String(s.wristExtension ?? "-"))} />
          <DataTableSubRow label="Finger" subLabel="Flexion" values={scores.map((s: any) => String(s.fingerFlexion ?? "-"))} />
          <DataTableSubRow label="" subLabel="Extension" values={scores.map((s: any) => String(s.fingerExtension ?? "-"))} />
          <DataTableSubRow label="Thumb" subLabel="Flexion" values={scores.map((s: any) => String(s.thumbFlexion ?? "-"))} />
          <DataTableSubRow label="" subLabel="Extension" values={scores.map((s: any) => String(s.thumbExtension ?? "-"))} />
          <DataTableRow
            label="Total Score"
            values={scores.map((s: any) => String(s.totalScore ?? "-"))}
            isHeader
          />
          <DataTableRow label="Sensation" values={scores.map((s: any) => s.sensation || "-")} />
          <DataTableRow label="Advise" values={scores.map((s: any) => s.advise || "-")} />
          <DataTableRow label="Remarks" values={scores.map((s: any) => s.remarks || "-")} />
        </View>
      </ScrollView>
    );
  }

  function renderMalletTab() {
    const visitsWithScores = visitsList.filter((v) => v.malletScore);
    if (visitsWithScores.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="document-text-outline" size={40} color={Colors.textLight} />
          <Text style={styles.noDataText}>No Mallet scores recorded</Text>
        </View>
      );
    }

    const dates = visitsWithScores.map((v) => formatDate(v.visitDate));
    const ages = visitsWithScores.map((v) =>
      calculateAge(patient.dateOfBirth, v.visitDate)
    );
    const scores = visitsWithScores.map((v) => v.malletScore);
    const interventions = visitsWithScores.map((v) => v.intervention || "-");

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={tableStyles.table}>
          <DataTableRow label="Date" values={dates} isHeader />
          <DataTableRow label="Age of Patient" values={ages} />
          <DataTableRow label="Intervention/Note" values={interventions} />
          <DataTableRow label="GA" values={scores.map((s: any) => s.ga || "-")} />
          <DataTableRow label="GER" values={scores.map((s: any) => s.ger || "-")} />
          <DataTableRow label="HTN" values={scores.map((s: any) => s.htn || "-")} />
          <DataTableRow label="HTS" values={scores.map((s: any) => s.hts || "-")} />
          <DataTableRow label="HTM" values={scores.map((s: any) => s.htm || "-")} />
          <DataTableRow label="IR" values={scores.map((s: any) => s.ir || "-")} />
          <DataTableRow label="AMS" values={scores.map((s: any) => s.ams || "-")} />
          <DataTableRow
            label="Mallet Score"
            values={scores.map((s: any) => {
              const total =
                (s.globalAbduction || 0) +
                (s.globalExternalRotation || 0) +
                (s.handToNeck || 0) +
                (s.handToSpine || 0) +
                (s.handToMouth || 0) +
                (s.handToMidline || 0);
              return `${total}/30`;
            })}
            isHeader
          />
          <DataTableRow
            label="Global Abduction"
            values={scores.map((s: any) => String(s.globalAbduction ?? "-"))}
          />
          <DataTableRow
            label="Global Ext. Rotation"
            values={scores.map((s: any) =>
              String(s.globalExternalRotation ?? "-")
            )}
          />
          <DataTableRow
            label="Hand to Neck"
            values={scores.map((s: any) => String(s.handToNeck ?? "-"))}
          />
          <DataTableRow
            label="Hand to Spine"
            values={scores.map((s: any) => String(s.handToSpine ?? "-"))}
          />
          <DataTableRow
            label="Hand to Mouth"
            values={scores.map((s: any) => String(s.handToMouth ?? "-"))}
          />
          <DataTableRow
            label="Hand to Midline"
            values={scores.map((s: any) => String(s.handToMidline ?? "-"))}
          />
        </View>
      </ScrollView>
    );
  }

  function renderClinicalTab() {
    const visitsWithExams = visitsList.filter((v) => v.clinicalExam);
    if (visitsWithExams.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="document-text-outline" size={40} color={Colors.textLight} />
          <Text style={styles.noDataText}>No clinical exams recorded</Text>
        </View>
      );
    }

    const dates = visitsWithExams.map((v) => formatDate(v.visitDate));
    const ages = visitsWithExams.map((v) =>
      calculateAge(patient.dateOfBirth, v.visitDate)
    );
    const exams = visitsWithExams.map((v) => v.clinicalExam);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={tableStyles.table}>
          <DataTableRow label="Date" values={dates} isHeader />
          <DataTableRow label="Age of Patient" values={ages} />
          <DataTableRow label="Shoulder Subluxation" values={exams.map((e: any) => e.shoulderSubluxation || "-")} />
          <DataTableRow label="Passive ER" values={exams.map((e: any) => e.passiveER || "-")} />
          <DataTableRow label="Active ER" values={exams.map((e: any) => e.activeER || "-")} />
          <DataTableRow label="Putti Sign" values={exams.map((e: any) => e.puttiSign || "-")} />
          <DataTableRow label="Elbow FFD" values={exams.map((e: any) => e.elbowFFD || "-")} />
          <DataTableRow label="Forearm Supination" values={exams.map((e: any) => e.forearmSupination || "-")} />
          <DataTableRow label="Forearm Pronation" values={exams.map((e: any) => e.forearmPronation || "-")} />
          <DataTableRow label="Degree of Trumpeting" values={exams.map((e: any) => e.degreeOfTrumpeting || "-")} />
          <DataTableRow label="Degree A ABD." values={exams.map((e: any) => e.degreeAAbd || "-")} />
          <DataTableRow label="ABD with PediWRAP" values={exams.map((e: any) => e.abdWithPediWrap || "-")} />
          <DataTableRow label="SAS" values={exams.map((e: any) => e.sas || "-")} />
          <DataTableRow label="DAC" values={exams.map((e: any) => e.dac || "-")} />
          <DataTableRow label="AIRD" values={exams.map((e: any) => e.aird || "-")} />
          <DataTableRow label="Wrist DF" values={exams.map((e: any) => e.wristDF || "-")} />
          <DataTableRow label="Thumb Abduction" values={exams.map((e: any) => e.thumbAbduction || "-")} />
          <DataTableRow label="IR in Abduction" values={exams.map((e: any) => e.irInAbduction || "-")} />
          <DataTableRow label="Triceps Strength" values={exams.map((e: any) => e.tricepsStrength || "-")} />
          <DataTableRow label="Grip" values={exams.map((e: any) => e.grip || "-")} />
          <DataTableRow label="Release" values={exams.map((e: any) => e.release || "-")} />
        </View>
      </ScrollView>
    );
  }

  const tabs = [
    { key: "info" as const, label: "Info", icon: "information-circle-outline" as const },
    { key: "hscams" as const, label: "HSC AMS", icon: "analytics-outline" as const },
    { key: "mallet" as const, label: "Mallet", icon: "bar-chart-outline" as const },
    { key: "clinical" as const, label: "Clinical", icon: "medkit-outline" as const },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {patient.childName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {patient.patientId} | {calculateAge(patient.dateOfBirth)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.pdfButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={async () => {
            try {
              const url = `${getApiUrl()}api/patients/${id}/pdf`;
              if (Platform.OS === "web") {
                const res = await fetch(url, { credentials: "include" });
                if (!res.ok) throw new Error("Failed to generate PDF");
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `${patient?.patientId || "patient"}_record.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              } else {
                const fileUri = `${FileSystem.cacheDirectory}${patient?.patientId || "patient"}_record.pdf`;
                const downloadResult = await FileSystem.downloadAsync(url, fileUri);
                if (downloadResult.status !== 200) throw new Error("Failed to download PDF");
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Patient Record PDF",
                  });
                } else {
                  Alert.alert("PDF Saved", `PDF saved to: ${fileUri}`);
                }
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to download PDF");
            }
          }}
        >
          <Ionicons name="document-text" size={18} color={Colors.secondary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.newVisitButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() =>
            router.push({
              pathname: "/visit/new",
              params: { patientId: id },
            })
          }
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "info" && renderInfoTab()}
        {activeTab === "hscams" && renderHscAmsTab()}
        {activeTab === "mallet" && renderMalletTab()}
        {activeTab === "clinical" && renderClinicalTab()}
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const tableStyles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerRow: {
    backgroundColor: "#EFF6FF",
  },
  labelCell: {
    width: 140,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  headerText: {
    fontFamily: "Inter_700Bold",
    color: Colors.secondary,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  valueCell: {
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  pdfButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  newVisitButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: "#FEF2F2",
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tableScrollContent: {
    paddingVertical: 8,
  },
  infoContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  infoValue: {
    flex: 1.2,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "right",
  },
  visitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 10,
  },
  visitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  visitMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visitIntervention: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.secondary,
    marginTop: 2,
  },
  visitFollowUp: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
