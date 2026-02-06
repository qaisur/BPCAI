import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { DatePicker } from "@/components/DatePicker";
import Colors from "@/constants/colors";

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years > 0) return `${years}Y ${months}M`;
  return `${months}M`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function FollowUpsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const followUpsQuery = useQuery<any[]>({
    queryKey: ["/api/follow-ups", `?date=${selectedDate}`],
    enabled: !!selectedDate,
  });

  const followUps = followUpsQuery.data || [];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + webTopInset,
          paddingBottom: Platform.OS === "web" ? 34 : 0,
        },
      ]}
    >
      <Text style={styles.headerTitle}>Follow-ups</Text>

      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Select Date</Text>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Pick a date to view follow-ups"
        />
      </View>

      {selectedDate ? (
        <View style={styles.resultHeader}>
          <Text style={styles.resultDate}>{formatDate(selectedDate)}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {followUps.length} patient{followUps.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      ) : null}

      {followUpsQuery.isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={followUps}
          keyExtractor={(item, index) => `${item.visitId}-${index}`}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.patientCard,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push(`/patient/${item.patientId}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardAvatar}>
                  <Ionicons name="person" size={18} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.childName}</Text>
                  <Text style={styles.cardId}>{item.patientIdCode}</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age</Text>
                  <Text style={styles.detailValue}>
                    {calculateAge(item.dateOfBirth)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Site Involvement</Text>
                  <Text style={styles.detailValue}>
                    {item.involvement || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>
                    {item.contactNumber || "N/A"}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !followUpsQuery.isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyText}>
                  No follow-ups scheduled for this date
                </Text>
              </View>
            ) : null
          }
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
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  dateSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultDate: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  patientCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  cardId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cardDetails: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
    textAlign: "center",
  },
});
