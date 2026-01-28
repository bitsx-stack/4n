import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

type Props = {
  selectedName?: string | null;
  placeholder?: string;
  onPress: () => void;
};

export default function VendorSelection({
  selectedName,
  placeholder = "Select Vendor",
  onPress,
}: Props) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>Vendor</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={[styles.value, !selectedName && styles.placeholder]}>
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
  value: { fontSize: 16, color: "#333", flex: 1 },
  placeholder: { color: "#999" },
  icon: { fontSize: 12, color: "#666", marginLeft: 8 },
});
