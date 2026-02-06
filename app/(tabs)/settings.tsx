import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/query-client";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { surgeon, logout } = useAuth();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [createError, setCreateError] = useState("");

  const surgeonsQuery = useQuery<any[]>({
    queryKey: ["/api/admin/surgeons"],
    enabled: !!surgeon?.isAdmin && adminModalVisible,
  });

  const createSurgeonMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; fullName: string }) => {
      const res = await apiRequest("POST", "/api/admin/create-surgeon", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/admin/surgeons"] });
      setNewUsername("");
      setNewPassword("");
      setNewFullName("");
      setCreateError("");
      Alert.alert("Success", "Surgeon account created successfully");
    },
    onError: (error: any) => {
      const msg = error.message || "Failed to create account";
      setCreateError(msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg);
    },
  });

  const deleteSurgeonMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/surgeons/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/admin/surgeons"] });
      Alert.alert("Success", "Surgeon account removed");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to remove account");
    },
  });

  function handleDeleteSurgeon(id: number, name: string) {
    if (Platform.OS === "web") {
      if (confirm(`Remove ${name}'s account? This cannot be undone.`)) {
        deleteSurgeonMutation.mutate(id);
      }
    } else {
      Alert.alert(
        "Remove Account",
        `Remove ${name}'s account? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => deleteSurgeonMutation.mutate(id),
          },
        ]
      );
    }
  }

  function handleCreateSurgeon() {
    setCreateError("");
    if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
      setCreateError("All fields are required");
      return;
    }
    createSurgeonMutation.mutate({
      username: newUsername.trim(),
      password: newPassword,
      fullName: newFullName.trim(),
    });
  }

  async function handleLogout() {
    if (Platform.OS === "web") {
      await logout();
      router.replace("/");
    } else {
      Alert.alert("Logout", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]);
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
        },
      ]}
    >
      <Text style={styles.headerTitle}>Settings</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={28} color={Colors.white} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{surgeon?.fullName}</Text>
          <Text style={styles.profileUsername}>@{surgeon?.username}</Text>
          {surgeon?.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      {surgeon?.isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <Pressable
            style={({ pressed }) => [
              styles.adminButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setAdminModalVisible(true)}
          >
            <Ionicons name="people" size={20} color={Colors.secondary} />
            <Text style={styles.adminButtonText}>Manage Surgeon Accounts</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Image
            source={require("@/assets/images/clinic-logo.png")}
            style={styles.aboutLogo}
            resizeMode="contain"
          />
          <Text style={styles.aboutName}>Brachial Plexus Clinic</Text>
          <Text style={styles.aboutTagline}>Hope in Every Touch</Text>
          <Text style={styles.aboutVersion}>BPC Records v1.0.0</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutPressed,
        ]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>

      <Modal
        visible={adminModalVisible}
        animationType="slide"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top + webTopInset }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Surgeons</Text>
            <Pressable onPress={() => setAdminModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.createSection}>
            <Text style={styles.createTitle}>Create New Account</Text>

            {createError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{createError}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name (e.g. Dr. John Doe)"
              value={newFullName}
              onChangeText={setNewFullName}
              autoCapitalize="words"
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={Colors.textLight}
            />
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && { opacity: 0.8 },
                createSurgeonMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleCreateSurgeon}
              disabled={createSurgeonMutation.isPending}
            >
              {createSurgeonMutation.isPending ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.listTitle}>Existing Accounts</Text>
          {surgeonsQuery.isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={surgeonsQuery.data || []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => (
                <View style={[styles.surgeonRow, item.isAdmin && styles.surgeonRowAdmin]}>
                  <View style={[styles.surgeonAvatar, item.isAdmin && { backgroundColor: Colors.primary }]}>
                    <Ionicons name={item.isAdmin ? "shield-checkmark" : "person"} size={18} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.surgeonName}>{item.fullName}</Text>
                    <Text style={styles.surgeonUsername}>
                      @{item.username}
                      {item.isAdmin ? " (Admin)" : ""}
                    </Text>
                    {item.isAdmin && (
                      <Text style={styles.protectedLabel}>Protected account</Text>
                    )}
                  </View>
                  {!item.isAdmin && (
                    <Pressable
                      onPress={() => handleDeleteSurgeon(item.id, item.fullName)}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && { opacity: 0.6 },
                      ]}
                      disabled={deleteSurgeonMutation.isPending}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </Pressable>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No accounts found</Text>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 20,
    marginTop: 8,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  adminBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adminButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  aboutName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  aboutTagline: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.secondary,
    marginTop: 4,
  },
  aboutVersion: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutPressed: {
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  createSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  createTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  listTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  surgeonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  surgeonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  surgeonName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  surgeonRowAdmin: {
    borderColor: Colors.primary,
    borderWidth: 1,
    backgroundColor: "#FEF2F2",
  },
  surgeonUsername: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  protectedLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#FEF2F2",
  },
  emptyText: {
    textAlign: "center" as const,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
    marginTop: 20,
  },
});
