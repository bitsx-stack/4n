import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

type Props = {
  selectedName?: string | null;
  placeholder?: string;
  disabled?: boolean;
  onPress: () => void;
};

export default function BrandSelection({
  selectedName,
  placeholder = "Select Brand",
  disabled = false,
  onPress,
}: Props) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>Brand</Text>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text
          style={[
            styles.value,
            !selectedName && styles.placeholder,
            disabled && styles.valueDisabled,
          ]}
        >
          {selectedName || placeholder}
        </Text>
        <Text style={styles.icon}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 10 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonDisabled: { backgroundColor: "#f0f0f0", opacity: 0.6 },
  value: { fontSize: 16, color: "#333", flex: 1 },
  placeholder: { color: "#999" },
  valueDisabled: { color: "#bbb" },
  icon: { fontSize: 12, color: "#666", marginLeft: 8 },
});
