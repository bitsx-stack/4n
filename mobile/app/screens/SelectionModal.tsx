import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

export type NamedItem = {
  id: number;
  name: string;
};

type SelectionModalProps<T extends NamedItem> = {
  visible: boolean;
  title: string;
  data: T[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  selectedItem: T | null;
  onSelect: (item: T) => void;
  onClose: () => void;
};

export default function SelectionModal<T extends NamedItem>({
  visible,
  title,
  data,
  loading = false,
  searchValue,
  onSearchChange,
  selectedItem,
  onSelect,
  onClose,
}: SelectionModalProps<T>) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholderTextColor="#999"
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      isSelected && styles.listItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                      onSearchChange("");
                    }}
                  >
                    <Text style={styles.listItemText}>{item.name}</Text>
                    {isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 24, color: "#666" },
  searchContainer: { padding: 16 },
  searchInput: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listItemSelected: { backgroundColor: "#e3f2fd" },
  listItemText: { fontSize: 16, color: "#333" },
  checkmark: { fontSize: 18, color: "#007AFF", fontWeight: "600" },
});
