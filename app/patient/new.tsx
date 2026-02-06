import React, { useState, useEffect, useMemo } from "react";
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { DropdownPicker } from "@/components/DropdownPicker";
import { DatePicker } from "@/components/DatePicker";
import Colors from "@/constants/colors";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

function SelectChips({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onSelect: (val: string) => void;
  multi?: boolean;
}) {
  const selectedArr = Array.isArray(selected) ? selected : [selected];
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const isActive = selectedArr.includes(opt);
        return (
          <Pressable
            key={opt}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PRESENTATIONS = ["Vertex", "Breech", "Footling", "Hand Prolapse"];
const DELIVERY_TYPES = ["Vaginal", "LSCS", "Forceps assisted", "Vacuum assisted"];
const DELIVERY_MODES = ["Home", "Hospital"];
const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];
const INVOLVEMENTS = ["Right", "Left", "Bilateral"];
const ASSOCIATED = [
  "# Humerus",
  "# Clavicle",
  "Horner syndrome",
  "Torticollis",
  "Hemi diaphragm involvement",
];

function makeNumberOptions(min: number, max: number, step = 1, suffix = "") {
  const opts: { label: string; value: string }[] = [];
  for (let i = min; i <= max; i += step) {
    const val = step < 1 ? i.toFixed(1) : String(i);
    opts.push({ label: `${val}${suffix}`, value: val });
  }
  return opts;
}

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const nextIdQuery = useQuery<{ patientId: string }>({
    queryKey: ["/api/patients/next-id"],
  });

  const [patientId, setPatientId] = useState("");
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Male");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  const [gestationalAge, setGestationalAge] = useState("");
  const [numberOfDelivery, setNumberOfDelivery] = useState("");
  const [presentationOfChild, setPresentationOfChild] = useState("");
  const [gestationalDiabetes, setGestationalDiabetes] = useState("");
  const [typeOfDelivery, setTypeOfDelivery] = useState("");
  const [modeOfDelivery, setModeOfDelivery] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [birthWeightOfSiblings, setBirthWeightOfSiblings] = useState("");
  const [shoulderDystocia, setShoulderDystocia] = useState("");
  const [difficultDelivery, setDifficultDelivery] = useState("");

  const [siblingAffection, setSiblingAffection] = useState("");
  const [associatedFeaturesAtBirth, setAssociatedFeaturesAtBirth] = useState("");
  const [involvement, setInvolvement] = useState("");
  const [associatedFeatures, setAssociatedFeatures] = useState<string[]>([]);
  const [associatedFeaturesNote, setAssociatedFeaturesNote] = useState("");

  useEffect(() => {
    if (nextIdQuery.data?.patientId && !patientId) {
      setPatientId(nextIdQuery.data.patientId);
    }
  }, [nextIdQuery.data]);

  const gestationalAgeOptions = useMemo(() => makeNumberOptions(16, 60, 1, " wk"), []);
  const deliveryNumberOptions = useMemo(() => makeNumberOptions(1, 20), []);
  const birthWeightOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    for (let w = 1.0; w <= 7.0; w += 0.1) {
      const val = w.toFixed(1);
      opts.push({ label: `${val} kg`, value: val });
    }
    return opts;
  }, []);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/patient/${data.id}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create patient");
    },
  });

  function handleAssociatedFeatureToggle(feature: string) {
    setAssociatedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }

  function handleSave() {
    if (!patientId.trim() || !childName.trim() || !dateOfBirth.trim()) {
      Alert.alert("Required Fields", "Please enter Patient ID, Child Name, and Date of Birth");
      return;
    }
    mutation.mutate({
      patientId: patientId.trim(),
      childName: childName.trim(),
      dateOfBirth,
      gender,
      fatherName: fatherName || null,
      motherName: motherName || null,
      contactNumber: contactNumber || null,
      address: address || null,
      gestationalAge: gestationalAge || null,
      numberOfDelivery: numberOfDelivery || null,
      presentationOfChild: presentationOfChild || null,
      gestationalDiabetes: gestationalDiabetes || null,
      typeOfDelivery: typeOfDelivery || null,
      modeOfDelivery: modeOfDelivery || null,
      birthWeight: birthWeight || null,
      birthWeightOfSiblings: birthWeightOfSiblings || null,
      shoulderDystocia: shoulderDystocia || null,
      difficultDelivery: difficultDelivery || null,
      siblingAffection: siblingAffection || null,
      associatedFeaturesAtBirth: associatedFeaturesAtBirth || null,
      involvement: involvement || null,
      associatedFeatures: associatedFeatures.length > 0 ? associatedFeatures.join(", ") : null,
      associatedFeaturesNote: associatedFeaturesNote || null,
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Patient</Text>
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
          <Text style={styles.sectionTitle}>Patient Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient ID *</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText}>
                {patientId || "Loading..."}
              </Text>
              <Ionicons name="lock-closed" size={14} color={Colors.textLight} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Child Name *</Text>
            <TextInput
              style={styles.textInput}
              value={childName}
              onChangeText={setChildName}
              placeholder="Full name of the child"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <DatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="Select date of birth"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <SelectChips
              options={["Male", "Female", "Other"]}
              selected={gender}
              onSelect={setGender}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Father's Name</Text>
            <TextInput
              style={styles.textInput}
              value={fatherName}
              onChangeText={setFatherName}
              placeholder="Father's name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mother's Name</Text>
            <TextInput
              style={styles.textInput}
              value={motherName}
              onChangeText={setMotherName}
              placeholder="Mother's name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.textInput}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              placeholderTextColor={Colors.textLight}
              multiline
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Birth History</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gestational Age at Delivery</Text>
            <DropdownPicker
              options={gestationalAgeOptions}
              selectedValue={gestationalAge}
              onSelect={setGestationalAge}
              placeholder="Select weeks (16-60)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. of Delivery</Text>
            <DropdownPicker
              options={deliveryNumberOptions}
              selectedValue={numberOfDelivery}
              onSelect={setNumberOfDelivery}
              placeholder="Select (1-20)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Presentation of Child</Text>
            <SelectChips
              options={PRESENTATIONS}
              selected={presentationOfChild}
              onSelect={setPresentationOfChild}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gestational Diabetes</Text>
            <DropdownPicker
              options={YES_NO_OPTIONS}
              selectedValue={gestationalDiabetes}
              onSelect={setGestationalDiabetes}
              placeholder="Select Yes/No"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type of Delivery</Text>
            <SelectChips
              options={DELIVERY_TYPES}
              selected={typeOfDelivery}
              onSelect={setTypeOfDelivery}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mode of Delivery</Text>
            <SelectChips
              options={DELIVERY_MODES}
              selected={modeOfDelivery}
              onSelect={setModeOfDelivery}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Weight</Text>
            <DropdownPicker
              options={birthWeightOptions}
              selectedValue={birthWeight}
              onSelect={setBirthWeight}
              placeholder="Select weight (1.0-7.0 kg)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Weight of Siblings</Text>
            <DropdownPicker
              options={birthWeightOptions}
              selectedValue={birthWeightOfSiblings}
              onSelect={setBirthWeightOfSiblings}
              placeholder="Select weight (1.0-7.0 kg)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>H/O Shoulder Dystocia</Text>
            <DropdownPicker
              options={YES_NO_OPTIONS}
              selectedValue={shoulderDystocia}
              onSelect={setShoulderDystocia}
              placeholder="Select Yes/No"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficult Delivery</Text>
            <DropdownPicker
              options={YES_NO_OPTIONS}
              selectedValue={difficultDelivery}
              onSelect={setDifficultDelivery}
              placeholder="Select Yes/No"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Family & Clinical History</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sibling Affection</Text>
            <DropdownPicker
              options={YES_NO_OPTIONS}
              selectedValue={siblingAffection}
              onSelect={setSiblingAffection}
              placeholder="Select Yes/No"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Associated Features at Birth</Text>
            <TextInput
              style={styles.textInput}
              value={associatedFeaturesAtBirth}
              onChangeText={setAssociatedFeaturesAtBirth}
              placeholder="Details..."
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Involvement</Text>
            <SelectChips
              options={INVOLVEMENTS}
              selected={involvement}
              onSelect={setInvolvement}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Associated Features</Text>
            <SelectChips
              options={ASSOCIATED}
              selected={associatedFeatures}
              onSelect={handleAssociatedFeatureToggle}
              multi
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Associated Features Note</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              value={associatedFeaturesNote}
              onChangeText={setAssociatedFeaturesNote}
              placeholder="Additional notes..."
              placeholderTextColor={Colors.textLight}
              multiline
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.9 },
            mutation.isPending && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Save Patient</Text>
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
    marginBottom: 16,
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
  readOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
  },
  readOnlyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.secondary,
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
