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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

const PRESENTATIONS = ["Vertex", "Breech", "Footling"];
const DELIVERY_TYPES = ["Vaginal", "LSCS", "Forceps assisted", "Vacuum assisted"];
const DELIVERY_MODES = ["Home", "Hospital"];
const YES_NO = ["Yes", "No"];
const INVOLVEMENTS = ["Right", "Left", "Bilateral"];
const ASSOCIATED = [
  "# Humerus",
  "# Clavicle",
  "Horner syndrome",
  "Torticollis",
  "Hemi diaphragm involvement",
];

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

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

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
            <TextInput
              style={styles.textInput}
              value={patientId}
              onChangeText={setPatientId}
              placeholder="e.g. BPC-001"
              placeholderTextColor={Colors.textLight}
            />
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
            <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="2025-01-15"
              placeholderTextColor={Colors.textLight}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <SelectChips
              options={["Male", "Female"]}
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
            <Text style={styles.label}>Gestational Age at Delivery (wk)</Text>
            <TextInput
              style={styles.textInput}
              value={gestationalAge}
              onChangeText={setGestationalAge}
              placeholder="e.g. 38"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. of Delivery</Text>
            <TextInput
              style={styles.textInput}
              value={numberOfDelivery}
              onChangeText={setNumberOfDelivery}
              placeholder="e.g. 1"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
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
            <SelectChips
              options={YES_NO}
              selected={gestationalDiabetes}
              onSelect={setGestationalDiabetes}
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
            <Text style={styles.label}>Birth Weight (kg)</Text>
            <TextInput
              style={styles.textInput}
              value={birthWeight}
              onChangeText={setBirthWeight}
              placeholder="e.g. 3.5"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Weight of Siblings (kg)</Text>
            <TextInput
              style={styles.textInput}
              value={birthWeightOfSiblings}
              onChangeText={setBirthWeightOfSiblings}
              placeholder="e.g. 3.2"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>H/O Shoulder Dystocia</Text>
            <SelectChips
              options={YES_NO}
              selected={shoulderDystocia}
              onSelect={setShoulderDystocia}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficult Delivery</Text>
            <SelectChips
              options={YES_NO}
              selected={difficultDelivery}
              onSelect={setDifficultDelivery}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Family History</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sibling Affection</Text>
            <SelectChips
              options={YES_NO}
              selected={siblingAffection}
              onSelect={setSiblingAffection}
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
