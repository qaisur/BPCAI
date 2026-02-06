import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

function ScoreInput({
  label,
  value,
  onChangeText,
  keyboardType = "numeric",
  placeholder = "0-7",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "numeric" | "default";
  placeholder?: string;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        style={styles.scoreInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType as any}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
      />
    </View>
  );
}

function TextFieldRow({
  label,
  value,
  onChangeText,
  placeholder = "Enter value",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        style={styles.scoreInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
      />
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

export default function NewVisitScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [visitType, setVisitType] = useState("Follow-up");
  const [intervention, setIntervention] = useState("");

  const [activeForm, setActiveForm] = useState<"hscams" | "mallet" | "clinical">("hscams");

  const [shoulderAbduction, setShoulderAbduction] = useState("");
  const [shoulderAdduction, setShoulderAdduction] = useState("");
  const [shoulderFFlexion, setShoulderFFlexion] = useState("");
  const [shoulderER, setShoulderER] = useState("");
  const [shoulderIR, setShoulderIR] = useState("");
  const [elbowFlexion, setElbowFlexion] = useState("");
  const [elbowExtension, setElbowExtension] = useState("");
  const [forearmSupination, setForearmSupination] = useState("");
  const [forearmPronation, setForearmPronation] = useState("");
  const [wristFlexion, setWristFlexion] = useState("");
  const [wristExtension, setWristExtension] = useState("");
  const [fingerFlexion, setFingerFlexion] = useState("");
  const [fingerExtension, setFingerExtension] = useState("");
  const [thumbFlexion, setThumbFlexion] = useState("");
  const [thumbExtension, setThumbExtension] = useState("");
  const [sensation, setSensation] = useState("");
  const [advise, setAdvise] = useState("");
  const [remarks, setRemarks] = useState("");

  const [globalAbduction, setGlobalAbduction] = useState("");
  const [globalExtRotation, setGlobalExtRotation] = useState("");
  const [handToNeck, setHandToNeck] = useState("");
  const [handToSpine, setHandToSpine] = useState("");
  const [handToMouth, setHandToMouth] = useState("");
  const [malletGA, setMalletGA] = useState("");
  const [malletGER, setMalletGER] = useState("");
  const [malletHTN, setMalletHTN] = useState("");
  const [malletHTS, setMalletHTS] = useState("");
  const [malletHTM, setMalletHTM] = useState("");
  const [malletIR, setMalletIR] = useState("");
  const [malletAMS, setMalletAMS] = useState("");

  const [shoulderSubluxation, setShoulderSubluxation] = useState("");
  const [passiveER, setPassiveER] = useState("");
  const [activeERExam, setActiveERExam] = useState("");
  const [puttiSign, setPuttiSign] = useState("");
  const [elbowFFD, setElbowFFD] = useState("");
  const [forearmSupExam, setForearmSupExam] = useState("");
  const [forearmProExam, setForearmProExam] = useState("");
  const [degreeOfTrumpeting, setDegreeOfTrumpeting] = useState("");
  const [degreeAAbd, setDegreeAAbd] = useState("");
  const [abdWithPediWrap, setAbdWithPediWrap] = useState("");
  const [sas, setSas] = useState("");
  const [dac, setDac] = useState("");
  const [aird, setAird] = useState("");
  const [wristDF, setWristDF] = useState("");
  const [thumbAbduction, setThumbAbduction] = useState("");
  const [irInAbduction, setIrInAbduction] = useState("");
  const [tricepsStrength, setTricepsStrength] = useState("");
  const [grip, setGrip] = useState("");
  const [release, setRelease] = useState("");

  const visitMutation = useMutation({
    mutationFn: async () => {
      const visitRes = await apiRequest(
        "POST",
        `/api/patients/${patientId}/visits`,
        {
          visitDate,
          visitType,
          intervention: intervention || null,
        }
      );
      const visit = await visitRes.json();

      const hasHscAms =
        shoulderAbduction || shoulderAdduction || shoulderFFlexion || elbowFlexion;
      if (hasHscAms) {
        const scoreFields = [
          shoulderAbduction, shoulderAdduction, shoulderFFlexion,
          shoulderER, shoulderIR, elbowFlexion, elbowExtension,
          forearmSupination, forearmPronation, wristFlexion, wristExtension,
          fingerFlexion, fingerExtension, thumbFlexion, thumbExtension,
        ];
        const total = scoreFields.reduce((sum, val) => {
          const n = parseInt(val);
          return sum + (isNaN(n) ? 0 : n);
        }, 0);

        await apiRequest("POST", `/api/visits/${visit.id}/hsc-ams`, {
          patientId: parseInt(patientId!),
          shoulderAbduction: parseInt(shoulderAbduction) || null,
          shoulderAdduction: parseInt(shoulderAdduction) || null,
          shoulderFFlexion: parseInt(shoulderFFlexion) || null,
          shoulderER: parseInt(shoulderER) || null,
          shoulderIR: parseInt(shoulderIR) || null,
          elbowFlexion: parseInt(elbowFlexion) || null,
          elbowExtension: parseInt(elbowExtension) || null,
          forearmSupination: parseInt(forearmSupination) || null,
          forearmPronation: parseInt(forearmPronation) || null,
          wristFlexion: parseInt(wristFlexion) || null,
          wristExtension: parseInt(wristExtension) || null,
          fingerFlexion: parseInt(fingerFlexion) || null,
          fingerExtension: parseInt(fingerExtension) || null,
          thumbFlexion: parseInt(thumbFlexion) || null,
          thumbExtension: parseInt(thumbExtension) || null,
          totalScore: total,
          sensation: sensation || null,
          advise: advise || null,
          remarks: remarks || null,
        });
      }

      const hasMallet =
        globalAbduction || globalExtRotation || handToNeck;
      if (hasMallet) {
        await apiRequest("POST", `/api/visits/${visit.id}/mallet`, {
          patientId: parseInt(patientId!),
          globalAbduction: parseInt(globalAbduction) || null,
          globalExternalRotation: parseInt(globalExtRotation) || null,
          handToNeck: parseInt(handToNeck) || null,
          handToSpine: parseInt(handToSpine) || null,
          handToMouth: parseInt(handToMouth) || null,
          aggregateScore:
            (parseInt(globalAbduction) || 0) +
            (parseInt(globalExtRotation) || 0) +
            (parseInt(handToNeck) || 0) +
            (parseInt(handToSpine) || 0) +
            (parseInt(handToMouth) || 0),
          ga: malletGA || null,
          ger: malletGER || null,
          htn: malletHTN || null,
          hts: malletHTS || null,
          htm: malletHTM || null,
          ir: malletIR || null,
          ams: malletAMS || null,
        });
      }

      const hasClinical = shoulderSubluxation || passiveER || activeERExam;
      if (hasClinical) {
        await apiRequest("POST", `/api/visits/${visit.id}/clinical-exam`, {
          patientId: parseInt(patientId!),
          shoulderSubluxation: shoulderSubluxation || null,
          passiveER: passiveER || null,
          activeER: activeERExam || null,
          puttiSign: puttiSign || null,
          elbowFFD: elbowFFD || null,
          forearmSupination: forearmSupExam || null,
          forearmPronation: forearmProExam || null,
          degreeOfTrumpeting: degreeOfTrumpeting || null,
          degreeAAbd: degreeAAbd || null,
          abdWithPediWrap: abdWithPediWrap || null,
          sas: sas || null,
          dac: dac || null,
          aird: aird || null,
          wristDF: wristDF || null,
          thumbAbduction: thumbAbduction || null,
          irInAbduction: irInAbduction || null,
          tricepsStrength: tricepsStrength || null,
          grip: grip || null,
          release: release || null,
        });
      }

      return visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/full-record`],
      });
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to save visit");
    },
  });

  function handleSave() {
    if (!visitDate.trim()) {
      Alert.alert("Required", "Please enter a visit date");
      return;
    }
    visitMutation.mutate();
  }

  const totalHscAms = [
    shoulderAbduction, shoulderAdduction, shoulderFFlexion,
    shoulderER, shoulderIR, elbowFlexion, elbowExtension,
    forearmSupination, forearmPronation, wristFlexion, wristExtension,
    fingerFlexion, fingerExtension, thumbFlexion, thumbExtension,
  ].reduce((sum, val) => {
    const n = parseInt(val);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const totalMallet =
    (parseInt(globalAbduction) || 0) +
    (parseInt(globalExtRotation) || 0) +
    (parseInt(handToNeck) || 0) +
    (parseInt(handToSpine) || 0) +
    (parseInt(handToMouth) || 0);

  const formTabs = [
    { key: "hscams" as const, label: "HSC AMS" },
    { key: "mallet" as const, label: "Mallet" },
    { key: "clinical" as const, label: "Clinical" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Visit</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
        bottomOffset={60}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Visit Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="2026-02-06"
              placeholderTextColor={Colors.textLight}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Type</Text>
            <View style={styles.chipRow}>
              {["First Visit", "Follow-up"].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.chip,
                    visitType === type && styles.chipActive,
                  ]}
                  onPress={() => setVisitType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      visitType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Intervention</Text>
            <TextInput
              style={styles.textInput}
              value={intervention}
              onChangeText={setIntervention}
              placeholder="e.g. N-2, Surgery details..."
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        <View style={styles.formTabBar}>
          {formTabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.formTab,
                activeForm === tab.key && styles.formTabActive,
              ]}
              onPress={() => setActiveForm(tab.key)}
            >
              <Text
                style={[
                  styles.formTabText,
                  activeForm === tab.key && styles.formTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeForm === "hscams" && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              HSC AMS Score (0-7 scale)
            </Text>
            <Text style={styles.scaleInfo}>
              0=No contraction, 1=Contraction no motion, 2={"<"}50% gravity eliminated, 3={">"}50% gravity eliminated, 4=Full gravity eliminated, 5={"<"}50% against gravity, 6={">"}50% against gravity, 7=Full motion
            </Text>

            <SectionHeader title="Shoulder" />
            <ScoreInput label="Abduction" value={shoulderAbduction} onChangeText={setShoulderAbduction} />
            <ScoreInput label="Adduction" value={shoulderAdduction} onChangeText={setShoulderAdduction} />
            <ScoreInput label="F Flexion" value={shoulderFFlexion} onChangeText={setShoulderFFlexion} />
            <ScoreInput label="ER" value={shoulderER} onChangeText={setShoulderER} />
            <ScoreInput label="IR" value={shoulderIR} onChangeText={setShoulderIR} />

            <SectionHeader title="Elbow" />
            <ScoreInput label="Flexion" value={elbowFlexion} onChangeText={setElbowFlexion} />
            <ScoreInput label="Extension" value={elbowExtension} onChangeText={setElbowExtension} />

            <SectionHeader title="Forearm" />
            <ScoreInput label="Supination" value={forearmSupination} onChangeText={setForearmSupination} />
            <ScoreInput label="Pronation" value={forearmPronation} onChangeText={setForearmPronation} />

            <SectionHeader title="Wrist" />
            <ScoreInput label="Flexion" value={wristFlexion} onChangeText={setWristFlexion} />
            <ScoreInput label="Extension" value={wristExtension} onChangeText={setWristExtension} />

            <SectionHeader title="Finger" />
            <ScoreInput label="Flexion" value={fingerFlexion} onChangeText={setFingerFlexion} />
            <ScoreInput label="Extension" value={fingerExtension} onChangeText={setFingerExtension} />

            <SectionHeader title="Thumb" />
            <ScoreInput label="Flexion" value={thumbFlexion} onChangeText={setThumbFlexion} />
            <ScoreInput label="Extension" value={thumbExtension} onChangeText={setThumbExtension} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Score</Text>
              <Text style={styles.totalValue}>{totalHscAms}</Text>
            </View>

            <TextFieldRow label="Sensation" value={sensation} onChangeText={setSensation} />
            <TextFieldRow label="Advise" value={advise} onChangeText={setAdvise} />
            <TextFieldRow label="Remarks" value={remarks} onChangeText={setRemarks} />
          </View>
        )}

        {activeForm === "mallet" && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mallet Score (Grade I-V = 1-5)</Text>
            <Text style={styles.scaleInfo}>
              I(1)=No function, II(2)={"<"}30, III(3)=30-90, IV(4)={">"}90, V(5)=Normal
            </Text>

            <ScoreInput label="Global Abduction" value={globalAbduction} onChangeText={setGlobalAbduction} placeholder="1-5" />
            <ScoreInput label="Global Ext. Rotation" value={globalExtRotation} onChangeText={setGlobalExtRotation} placeholder="1-5" />
            <ScoreInput label="Hand to Neck" value={handToNeck} onChangeText={setHandToNeck} placeholder="1-5" />
            <ScoreInput label="Hand to Spine" value={handToSpine} onChangeText={setHandToSpine} placeholder="1-5" />
            <ScoreInput label="Hand to Mouth" value={handToMouth} onChangeText={setHandToMouth} placeholder="1-5" />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Aggregate Score</Text>
              <Text style={styles.totalValue}>{totalMallet}/30</Text>
            </View>

            <SectionHeader title="Additional Fields" />
            <TextFieldRow label="GA" value={malletGA} onChangeText={setMalletGA} />
            <TextFieldRow label="GER" value={malletGER} onChangeText={setMalletGER} />
            <TextFieldRow label="HTN" value={malletHTN} onChangeText={setMalletHTN} />
            <TextFieldRow label="HTS" value={malletHTS} onChangeText={setMalletHTS} />
            <TextFieldRow label="HTM" value={malletHTM} onChangeText={setMalletHTM} />
            <TextFieldRow label="IR" value={malletIR} onChangeText={setMalletIR} />
            <TextFieldRow label="AMS" value={malletAMS} onChangeText={setMalletAMS} />
          </View>
        )}

        {activeForm === "clinical" && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Clinical Examination</Text>

            <TextFieldRow label="Shoulder Subluxation" value={shoulderSubluxation} onChangeText={setShoulderSubluxation} placeholder="Yes/No" />
            <TextFieldRow label="Passive ER" value={passiveER} onChangeText={setPassiveER} placeholder="e.g. 0, -10" />
            <TextFieldRow label="Active ER" value={activeERExam} onChangeText={setActiveERExam} placeholder="e.g. -30, -40" />
            <TextFieldRow label="Putti Sign" value={puttiSign} onChangeText={setPuttiSign} />
            <TextFieldRow label="Elbow FFD" value={elbowFFD} onChangeText={setElbowFFD} placeholder="e.g. 10" />
            <TextFieldRow label="Forearm Supination" value={forearmSupExam} onChangeText={setForearmSupExam} placeholder="e.g. None" />
            <TextFieldRow label="Forearm Pronation" value={forearmProExam} onChangeText={setForearmProExam} placeholder="e.g. >MP, F" />
            <TextFieldRow label="Degree of Trumpeting" value={degreeOfTrumpeting} onChangeText={setDegreeOfTrumpeting} placeholder="e.g. 0" />
            <TextFieldRow label="Degree A ABD." value={degreeAAbd} onChangeText={setDegreeAAbd} placeholder="e.g. 30" />
            <TextFieldRow label="ABD with PediWRAP" value={abdWithPediWrap} onChangeText={setAbdWithPediWrap} placeholder="e.g. 0" />
            <TextFieldRow label="SAS" value={sas} onChangeText={setSas} placeholder="Yes/No" />
            <TextFieldRow label="DAC" value={dac} onChangeText={setDac} placeholder="Yes/No" />
            <TextFieldRow label="AIRD" value={aird} onChangeText={setAird} placeholder="e.g. 0" />
            <TextFieldRow label="Wrist DF" value={wristDF} onChangeText={setWristDF} placeholder="e.g. weak" />
            <TextFieldRow label="Thumb Abduction" value={thumbAbduction} onChangeText={setThumbAbduction} placeholder="e.g. weak" />
            <TextFieldRow label="IR in Abduction" value={irInAbduction} onChangeText={setIrInAbduction} placeholder="e.g. 0" />
            <TextFieldRow label="Triceps Strength" value={tricepsStrength} onChangeText={setTricepsStrength} placeholder="e.g. N" />
            <TextFieldRow label="Grip" value={grip} onChangeText={setGrip} />
            <TextFieldRow label="Release" value={release} onChangeText={setRelease} />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.9 },
            visitMutation.isPending && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={visitMutation.isPending}
        >
          {visitMutation.isPending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Save Visit</Text>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  scaleInfo: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  formTabBar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  formTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  formTabTextActive: {
    color: Colors.white,
  },
  sectionHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.secondary,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scoreLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  scoreInput: {
    width: 100,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    textAlign: "center",
    backgroundColor: Colors.background,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.secondary,
  },
  totalLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.secondary,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    minWidth: 100,
    textAlign: "center",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
