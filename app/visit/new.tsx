import React, { useState, useMemo } from "react";
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
import { DropdownPicker } from "@/components/DropdownPicker";
import { DatePicker } from "@/components/DatePicker";
import Colors from "@/constants/colors";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

function ScoreDropdownRow({
  label,
  value,
  onSelect,
  options,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onSelect: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.scoreDropdown}>
        <DropdownPicker
          options={options}
          selectedValue={value}
          onSelect={onSelect}
          placeholder={placeholder}
        />
      </View>
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

function makeOptions(min: number, max: number, step = 1, suffix = "") {
  const opts: { label: string; value: string }[] = [];
  for (let i = min; i <= max; i += step) {
    const val = String(i);
    opts.push({ label: `${val}${suffix}`, value: val });
  }
  return opts;
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

  const hscAmsOptions = useMemo(() => makeOptions(0, 7), []);
  const malletOptions = useMemo(() => [
    { label: "I (1)", value: "1" },
    { label: "II (2)", value: "2" },
    { label: "III (3)", value: "3" },
    { label: "IV (4)", value: "4" },
    { label: "V (5)", value: "5" },
  ], []);

  const yesNoOptions = useMemo(() => [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ], []);

  const erOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    for (let i = -90; i <= 90; i += 5) {
      opts.push({ label: `${i >= 0 ? "+" : ""}${i}\u00B0`, value: String(i) });
    }
    return opts;
  }, []);

  const angleOptions0to180 = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    for (let i = 0; i <= 180; i += 5) {
      opts.push({ label: `${i}\u00B0`, value: String(i) });
    }
    return opts;
  }, []);

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
            <Text style={styles.label}>Visit Date</Text>
            <DatePicker
              value={visitDate}
              onChange={setVisitDate}
              placeholder="Select visit date"
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
            <Text style={styles.label}>Intervention/Note</Text>
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
            <ScoreDropdownRow label="Abduction" value={shoulderAbduction} onSelect={setShoulderAbduction} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Adduction" value={shoulderAdduction} onSelect={setShoulderAdduction} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="F Flexion" value={shoulderFFlexion} onSelect={setShoulderFFlexion} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="ER" value={shoulderER} onSelect={setShoulderER} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="IR" value={shoulderIR} onSelect={setShoulderIR} options={hscAmsOptions} placeholder="0-7" />

            <SectionHeader title="Elbow" />
            <ScoreDropdownRow label="Flexion" value={elbowFlexion} onSelect={setElbowFlexion} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Extension" value={elbowExtension} onSelect={setElbowExtension} options={hscAmsOptions} placeholder="0-7" />

            <SectionHeader title="Forearm" />
            <ScoreDropdownRow label="Supination" value={forearmSupination} onSelect={setForearmSupination} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Pronation" value={forearmPronation} onSelect={setForearmPronation} options={hscAmsOptions} placeholder="0-7" />

            <SectionHeader title="Wrist" />
            <ScoreDropdownRow label="Flexion" value={wristFlexion} onSelect={setWristFlexion} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Extension" value={wristExtension} onSelect={setWristExtension} options={hscAmsOptions} placeholder="0-7" />

            <SectionHeader title="Finger" />
            <ScoreDropdownRow label="Flexion" value={fingerFlexion} onSelect={setFingerFlexion} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Extension" value={fingerExtension} onSelect={setFingerExtension} options={hscAmsOptions} placeholder="0-7" />

            <SectionHeader title="Thumb" />
            <ScoreDropdownRow label="Flexion" value={thumbFlexion} onSelect={setThumbFlexion} options={hscAmsOptions} placeholder="0-7" />
            <ScoreDropdownRow label="Extension" value={thumbExtension} onSelect={setThumbExtension} options={hscAmsOptions} placeholder="0-7" />

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
            <Text style={styles.sectionTitle}>Mallet Score (Grade I-V)</Text>
            <Text style={styles.scaleInfo}>
              I(1)=No function, II(2)={"<"}30, III(3)=30-90, IV(4)={">"}90, V(5)=Normal
            </Text>

            <ScoreDropdownRow label="Global Abduction" value={globalAbduction} onSelect={setGlobalAbduction} options={malletOptions} placeholder="I-V" />
            <ScoreDropdownRow label="Global Ext. Rotation" value={globalExtRotation} onSelect={setGlobalExtRotation} options={malletOptions} placeholder="I-V" />
            <ScoreDropdownRow label="Hand to Neck" value={handToNeck} onSelect={setHandToNeck} options={malletOptions} placeholder="I-V" />
            <ScoreDropdownRow label="Hand to Spine" value={handToSpine} onSelect={setHandToSpine} options={malletOptions} placeholder="I-V" />
            <ScoreDropdownRow label="Hand to Mouth" value={handToMouth} onSelect={setHandToMouth} options={malletOptions} placeholder="I-V" />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Aggregate Score</Text>
              <Text style={styles.totalValue}>{totalMallet}/25</Text>
            </View>
          </View>
        )}

        {activeForm === "clinical" && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Clinical Examination</Text>

            <ScoreDropdownRow label="Shoulder Subluxation" value={shoulderSubluxation} onSelect={setShoulderSubluxation} options={yesNoOptions} placeholder="Yes/No" />
            <ScoreDropdownRow label="Passive ER" value={passiveER} onSelect={setPassiveER} options={erOptions} placeholder="-90 to +90" />
            <ScoreDropdownRow label="Active ER" value={activeERExam} onSelect={setActiveERExam} options={erOptions} placeholder="-90 to +90" />
            <ScoreDropdownRow label="Putti Sign" value={puttiSign} onSelect={setPuttiSign} options={yesNoOptions} placeholder="Yes/No" />
            <ScoreDropdownRow label="Elbow FFD" value={elbowFFD} onSelect={setElbowFFD} options={angleOptions0to180} placeholder="0-180" />
            <ScoreDropdownRow label="Forearm Supination" value={forearmSupExam} onSelect={setForearmSupExam} options={angleOptions0to180} placeholder="0-180" />
            <ScoreDropdownRow label="Forearm Pronation" value={forearmProExam} onSelect={setForearmProExam} options={angleOptions0to180} placeholder="0-180" />
            <ScoreDropdownRow label="Trumpeting" value={degreeOfTrumpeting} onSelect={setDegreeOfTrumpeting} options={angleOptions0to180} placeholder="0-180" />
            <ScoreDropdownRow label="Degree A ABD." value={degreeAAbd} onSelect={setDegreeAAbd} options={angleOptions0to180} placeholder="0-180" />
            <ScoreDropdownRow label="ABD PediWRAP" value={abdWithPediWrap} onSelect={setAbdWithPediWrap} options={angleOptions0to180} placeholder="0-180" />
            <TextFieldRow label="SAS" value={sas} onChangeText={setSas} placeholder="Enter value" />
            <TextFieldRow label="DAC" value={dac} onChangeText={setDac} placeholder="Enter value" />
            <ScoreDropdownRow label="AIRD" value={aird} onSelect={setAird} options={angleOptions0to180} placeholder="0-180" />
            <TextFieldRow label="Wrist DF" value={wristDF} onChangeText={setWristDF} placeholder="e.g. weak" />
            <TextFieldRow label="Thumb Abduction" value={thumbAbduction} onChangeText={setThumbAbduction} placeholder="e.g. weak" />
            <ScoreDropdownRow label="IR in Abduction" value={irInAbduction} onSelect={setIrInAbduction} options={angleOptions0to180} placeholder="0-180" />
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
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  formTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  formTabTextActive: {
    color: Colors.white,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  scoreLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  scoreDropdown: {
    width: 130,
  },
  scoreInput: {
    width: 130,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    backgroundColor: Colors.background,
    textAlign: "center" as const,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.secondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
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
