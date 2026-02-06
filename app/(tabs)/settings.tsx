import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { surgeon, logout } = useAuth();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

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
        </View>
      </View>

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
});
