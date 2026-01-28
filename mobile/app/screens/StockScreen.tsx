import { useAuthContext } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";

interface Vendor {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
  vendor_id: number;
}

interface Model {
  id: number;
  name: string;
  brand_id: number;
}

type SelectableItem = Vendor | Brand | Model;

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: SelectableItem[];
  onSelect: (item: SelectableItem) => void;
  loading: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  selectedItem: SelectableItem | null;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  onClose,
  title,
  data,
  onSelect,
  loading,
  searchValue,
  onSearchChange,
  selectedItem,
}) => (
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.listItem,
                  selectedItem?.id === item.id && styles.listItemSelected,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                  onSearchChange("");
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                {selectedItem?.id === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  </Modal>
);

const StockScreen: React.FC = () => {
  const { logout } = useAuthContext();

  // Selections
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  // Loading
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // Search
  const [vendorSearch, setVendorSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchBrandsByVendor(selectedVendor.id);
      setSelectedBrand(null);
      setSelectedModel(null);
    } else {
      setBrands([]);
      setSelectedBrand(null);
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedVendor]);

  useEffect(() => {
    if (selectedBrand) {
      fetchModelsByBrand(selectedBrand.id);
      setSelectedModel(null);
    } else {
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedBrand]);

  const fetchVendors = async (): Promise<void> => {
    setLoadingVendors(true);
    try {
      // TODO: replace with API
      setVendors([
        { id: 1, name: "Vendor A" },
        { id: 2, name: "Vendor B" },
        { id: 3, name: "Vendor C" },
      ]);
    } catch {
      Alert.alert("Error", "Failed to fetch vendors");
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchBrandsByVendor = async (vendorId: number): Promise<void> => {
    setLoadingBrands(true);
    try {
      // TODO: replace with API
      const mockBrands: Record<number, Brand[]> = {
        1: [
          { id: 1, name: "Apple", vendor_id: 1 },
          { id: 2, name: "Samsung", vendor_id: 1 },
        ],
        2: [
          { id: 3, name: "Xiaomi", vendor_id: 2 },
          { id: 4, name: "Huawei", vendor_id: 2 },
        ],
        3: [
          { id: 5, name: "Oppo", vendor_id: 3 },
          { id: 6, name: "OnePlus", vendor_id: 3 },
        ],
      };
      setBrands(mockBrands[vendorId] || []);
    } catch {
      Alert.alert("Error", "Failed to fetch brands");
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchModelsByBrand = async (brandId: number): Promise<void> => {
    setLoadingModels(true);
    try {
      // TODO: replace with API
      const mockModels: Record<number, Model[]> = {
        1: [
          { id: 1, name: "iPhone 15 Pro Max", brand_id: 1 },
          { id: 2, name: "iPhone 15 Pro", brand_id: 1 },
        ],
        2: [
          { id: 3, name: "Galaxy S24 Ultra", brand_id: 2 },
          { id: 4, name: "Galaxy S24+", brand_id: 2 },
        ],
        3: [
          { id: 5, name: "Xiaomi 14 Pro", brand_id: 3 },
          { id: 6, name: "Redmi Note 13", brand_id: 3 },
        ],
        4: [
          { id: 7, name: "Mate 60 Pro", brand_id: 4 },
          { id: 8, name: "P60 Pro", brand_id: 4 },
        ],
        5: [
          { id: 9, name: "Find X6 Pro", brand_id: 5 },
          { id: 10, name: "Reno 10 Pro", brand_id: 5 },
        ],
        6: [
          { id: 11, name: "OnePlus 12", brand_id: 6 },
          { id: 12, name: "OnePlus 11R", brand_id: 6 },
        ],
      };
      setModels(mockModels[brandId] || []);
    } catch {
      Alert.alert("Error", "Failed to fetch models");
    } finally {
      setLoadingModels(false);
    }
  };

  const handleStartScanning = (): void => {
    if (!selectedVendor || !selectedBrand || !selectedModel) {
      Alert.alert("Error", "Please select vendor, brand, and model first");
      return;
    }
    Alert.alert(
      "Success",
      `Starting scan for ${selectedModel.name} (${selectedBrand.name}) from ${selectedVendor.name}`,
    );
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch {
      Alert.alert("Error", "Failed to logout");
    }
  };

  // Filters
  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()),
  );
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()),
  );

  const isFormComplete = selectedVendor && selectedBrand && selectedModel;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Stock Taking</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, User
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📋 Instructions</Text>
          <Text style={styles.instructionText}>
            1. Select a vendor{"\n"}
            2. Choose the brand{"\n"}
            3. Select the model{"\n"}
            4. Start scanning IMEI codes
          </Text>
        </View>

        {/* Selection Card */}
        <View style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>Selections</Text>

          {/* Vendor */}
          <Text style={styles.fieldLabel}>Vendor</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowVendorModal(true)}
          >
            <Text
              style={[
                styles.selectButtonLabel,
                !selectedVendor && styles.selectButtonPlaceholder,
              ]}
            >
              {selectedVendor ? selectedVendor.name : "Select Vendor"}
            </Text>
            <Text style={styles.selectButtonIcon}>▼</Text>
          </TouchableOpacity>

          {/* Brand */}
          <Text style={styles.fieldLabel}>Brand</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedVendor && styles.selectButtonDisabled,
            ]}
            onPress={() => {
              if (!selectedVendor) {
                Alert.alert("Info", "Please select vendor first");
                return;
              }
              setShowBrandModal(true);
            }}
            disabled={!selectedVendor}
          >
            <Text
              style={[
                styles.selectButtonLabel,
                !selectedBrand && styles.selectButtonPlaceholder,
                !selectedVendor && styles.selectButtonLabelDisabled,
              ]}
            >
              {selectedBrand ? selectedBrand.name : "Select Brand"}
            </Text>
            <Text style={styles.selectButtonIcon}>▼</Text>
          </TouchableOpacity>

          {/* Model */}
          <Text style={styles.fieldLabel}>Model</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedBrand && styles.selectButtonDisabled,
            ]}
            onPress={() => {
              if (!selectedBrand) {
                Alert.alert("Info", "Please select brand first");
                return;
              }
              setShowModelModal(true);
            }}
            disabled={!selectedBrand}
          >
            <Text
              style={[
                styles.selectButtonLabel,
                !selectedModel && styles.selectButtonPlaceholder,
                !selectedBrand && styles.selectButtonLabelDisabled,
              ]}
            >
              {selectedModel ? selectedModel.name : "Select Model"}
            </Text>
            <Text style={styles.selectButtonIcon}>▼</Text>
          </TouchableOpacity>

          {/* Start Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !isFormComplete && styles.primaryButtonDisabled,
            ]}
            onPress={handleStartScanning}
            disabled={!isFormComplete}
          >
            <Text style={styles.primaryButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {isFormComplete && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selection Summary</Text>
            <Text style={styles.summaryText}>
              Vendor: {selectedVendor.name}
            </Text>
            <Text style={styles.summaryText}>Brand: {selectedBrand.name}</Text>
            <Text style={styles.summaryText}>Model: {selectedModel.name}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <SelectionModal
        visible={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title="Select Vendor"
        data={filteredVendors}
        onSelect={(item) => setSelectedVendor(item as Vendor)}
        loading={loadingVendors}
        searchValue={vendorSearch}
        onSearchChange={setVendorSearch}
        selectedItem={selectedVendor}
      />
      <SelectionModal
        visible={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title="Select Brand"
        data={filteredBrands}
        onSelect={(item) => setSelectedBrand(item as Brand)}
        loading={loadingBrands}
        searchValue={brandSearch}
        onSearchChange={setBrandSearch}
        selectedItem={selectedBrand}
      />
      <SelectionModal
        visible={showModelModal}
        onClose={() => setShowModelModal(false)}
        title="Select Model"
        data={filteredModels}
        onSelect={(item) => setSelectedModel(item as Model)}
        loading={loadingModels}
        searchValue={modelSearch}
        onSearchChange={setModelSearch}
        selectedItem={selectedModel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  logoutText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionCard: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1976d2",
  },
  instructionText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  selectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
    marginTop: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  selectButtonDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  selectButtonLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: "#999",
  },
  selectButtonLabelDisabled: {
    color: "#bbb",
  },
  selectButtonIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#ccc",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2e7d32",
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
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
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    padding: 12,
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
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listItemSelected: {
    backgroundColor: "#e3f2fd",
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
  },
  checkmark: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default StockScreen;
