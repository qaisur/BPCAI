import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface Patient {
  id: number;
  patientId: string;
  childName: string;
  dateOfBirth: string;
  gender: string;
  involvement?: string;
  contactNumber?: string;
  createdAt: string;
}

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const { surgeon } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: patients,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery ? `?search=${searchQuery}` : ""],
  });

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const calculateAge = useCallback((dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    if (y > 0) return `${y}Y ${m}M`;
    return `${m}M`;
  }, []);

  function renderPatientItem({ item }: { item: Patient }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.patientCard,
          pressed && styles.patientCardPressed,
        ]}
        onPress={() => router.push(`/patient/${item.id}`)}
      >
        <View style={styles.patientAvatar}>
          <Ionicons
            name={item.gender === "Male" ? "male" : "female"}
            size={22}
            color={Colors.white}
          />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.childName}</Text>
          <Text style={styles.patientMeta}>
            ID: {item.patientId} | Age: {calculateAge(item.dateOfBirth)}
          </Text>
          {item.involvement && (
            <Text style={styles.patientTag}>{item.involvement} side</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </Pressable>
    );
  }

  function renderEmptyState() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>
          {searchQuery ? "No patients found" : "No patients yet"}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? "Try a different search term"
            : "Tap the + button to add a new patient"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/clinic-logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>BPC Records</Text>
            <Text style={styles.headerSubtitle}>
              Dr. {surgeon?.fullName || ""}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push("/patient/new")}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={18}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or patient ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={patients || []}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  patientCardPressed: {
    backgroundColor: Colors.borderLight,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  patientMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  patientTag: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 4,
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
