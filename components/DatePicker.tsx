import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);

  const parsed = useMemo(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = 2030; y >= 1990; y--) arr.push(y);
    return arr;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const days = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [daysInMonth]);

  function handleOpen() {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth());
        setSelectedDay(d.getDate());
      }
    }
    setVisible(true);
  }

  function handleConfirm() {
    const day = Math.min(selectedDay, daysInMonth);
    const mm = String(selectedMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${selectedYear}-${mm}-${dd}`);
    setVisible(false);
  }

  const displayValue = value
    ? (() => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : "";

  return (
    <>
      <Pressable style={styles.trigger} onPress={handleOpen}>
        <Text
          style={[styles.triggerText, !value && styles.placeholderText]}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <Pressable
                      key={d}
                      style={[
                        styles.pickerItem,
                        d === selectedDay && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          d === selectedDay && styles.pickerItemTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m, idx) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.pickerItem,
                        idx === selectedMonth && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedMonth(idx)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          idx === selectedMonth && styles.pickerItemTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <Pressable
                      key={y}
                      style={[
                        styles.pickerItem,
                        y === selectedYear && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedYear(y)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          y === selectedYear && styles.pickerItemTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewText}>
                {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
              </Text>
            </View>

            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
  },
  triggerText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  pickerRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  pickerCol: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase" as const,
  },
  scrollPicker: {
    maxHeight: 200,
    width: "100%",
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 1,
  },
  pickerItemActive: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  pickerItemTextActive: {
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  previewRow: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 8,
  },
  previewText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    marginTop: 4,
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
