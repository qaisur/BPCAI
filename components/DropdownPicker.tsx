import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface DropdownPickerProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export function DropdownPicker({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select...",
}: DropdownPickerProps) {
  const [visible, setVisible] = useState(false);
  const pendingValue = useRef<string | null>(null);

  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label || "";

  const handleSelect = useCallback((value: string) => {
    pendingValue.current = value;
    setVisible(false);
    setTimeout(() => {
      if (pendingValue.current !== null) {
        const val = pendingValue.current;
        pendingValue.current = null;
        onSelect(val);
      }
    }, 300);
  }, [onSelect]);

  const handleModalHide = useCallback(() => {
    if (pendingValue.current !== null) {
      const val = pendingValue.current;
      pendingValue.current = null;
      onSelect(val);
    }
  }, [onSelect]);

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedValue && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={Colors.textSecondary}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        onDismiss={handleModalHide}
        statusBarTranslucent
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.value === selectedValue && styles.optionActive,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === selectedValue && styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === selectedValue && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </Pressable>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={true}
            />
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    width: "100%",
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
  list: {
    maxHeight: 400,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionActive: {
    backgroundColor: "#FEF2F2",
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  optionTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
