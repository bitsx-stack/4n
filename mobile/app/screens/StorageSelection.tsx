import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface StorageSelectionProps {
  selectedStorage: { id: number; name: string } | null;
  options: { id: number; name: string }[];
  loading?: boolean;
  disabled?: boolean;
  onSelect: (storage: { id: number; name: string }) => void;
}

const StorageSelection: React.FC<StorageSelectionProps> = ({
  selectedStorage,
  options,
  loading = false,
  disabled = false,
  onSelect,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = useMemo(
    () =>
      options.filter((option) =>
        option.name.toLowerCase().includes(searchValue.toLowerCase()),
      ),
    [options, searchValue],
  );

  const handleSelect = (item: { id: number; name: string }) => {
    onSelect(item);
    setShowModal(false);
    setSearchValue("");
  };

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ marginBottom: 6 }}>Storage</Text>
      <TouchableOpacity
        style={[styles.selectBtn, disabled && styles.selectBtnDisabled]}
        disabled={disabled}
        onPress={() => setShowModal(true)}
      >
        <Text style={{ color: selectedStorage ? "#111" : "#999" }}>
          {selectedStorage?.name ?? "Select Storage"}
        </Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Storage</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search storage..."
              placeholderTextColor="#999"
              value={searchValue}
              onChangeText={setSearchValue}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      selectedStorage?.id === item.id &&
                        styles.optionItemSelected,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedStorage?.id === item.id &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No storage options found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
  },
  selectBtnDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
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
    fontWeight: "bold",
  },
  closeBtn: {
    fontSize: 20,
    color: "#666",
    padding: 4,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionItemSelected: {
    backgroundColor: "#e6f2ff",
  },
  optionText: {
    fontSize: 16,
    color: "#111",
  },
  optionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
  },
});

export default StorageSelection;
