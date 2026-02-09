import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";

import {
  categoryApi,
  categoryTypeApi,
  imeiApi,
  purchasesApi,
  vendorApi,
} from "../../util/api";
import { NamedItem } from "../types";
import BrandSelection from "./BrandSelection";
import SelectionModal from "./SelectionModal";
import StorageSelection from "./StorageSelection";
import VendorSelection from "./VendorSelection";
import { useAuthContext } from "@/context/AuthContext";
import LogoutButton from "@/components/LogoutButton";

type Vendor = NamedItem;
type Brand = NamedItem;
type Model = NamedItem;

type ScannedItem = {
  imei_code: string;
  brand: string;
  model: string;
  scannedAt: string;
  size: string;
};

const StockTakingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const auth = useAuthContext();

  const { storeId, storeName } = route.params ?? {};

  // selection state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  const [vendorSearch, setVendorSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [storageOptions, setStorageOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Storage selection
  const [selectedStorage, setSelectedStorage] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // scanning + submit
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await vendorApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setVendors(list.map((v: any) => ({ id: v.id, name: v.name })));
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const list = await categoryApi.listByType(16);
      console.log("Fetched brands:", list);
      setBrands(list.map((b: any) => ({ id: b.id, name: b.name })));
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchModelsByBrand = async (name: string) => {
    setLoadingModels(true);
    try {
      const list = await categoryApi.listByTypeName(name);
      setModels(
        list.map((m: any) => ({
          id: m.id,
          name: m.name,
        })),
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchStorageOptions = async () => {
    setLoadingStorage(true);
    try {
      const res = await imeiApi.getStorageOptions();
      const list = Array.isArray(res.data) ? res.data : [];
      setStorageOptions(list);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchBrands();
    fetchStorageOptions();
  }, []);

  useEffect(() => {
    if (!selectedVendor) {
      setModels([]);
      setSelectedBrand(null);
      setSelectedModel(null);
      return;
    }
    setSelectedBrand(null);
    setSelectedModel(null);
    setModels([]);
  }, [selectedVendor]);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel(null);
      return;
    }
    setSelectedModel(null);
    fetchModelsByBrand(selectedBrand.name.toLocaleUpperCase());
  }, [selectedBrand]);

  useEffect(() => {
    setSelectedStorage(null);
  }, [selectedModel]);

  const filteredVendors = useMemo(
    () =>
      vendors.filter((v) =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()),
      ),
    [vendors, vendorSearch],
  );

  const filteredBrands = useMemo(
    () =>
      brands.filter((b) =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase()),
      ),
    [brands, brandSearch],
  );

  const filteredModels = useMemo(
    () =>
      models.filter((m) =>
        m.name.toLowerCase().includes(modelSearch.toLowerCase()),
      ),
    [models, modelSearch],
  );

  const requestCameraPermission = async () => {
    if (!selectedVendor || !selectedBrand || !selectedModel) {
      Alert.alert("Selections", "Please select vendor, brand and model first.");
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera permission is required to scan barcodes",
        );
        return;
      }
    }

    setScanned(false);
    setShowScanner(true);
  };

  const addScannedItem = (barcode: string) => {
    const code = barcode?.trim();
    if (!code) return;

    if (!selectedBrand || !selectedModel || !selectedStorage) {
      Alert.alert(
        "Selections",
        "Please select vendor, brand, model and storage before scanning.",
      );
      return;
    }

    setScannedItems((prev) => {
      if (prev.some((x) => x.imei_code === code)) {
        Alert.alert("Duplicate", "This IMEI was already scanned.");
        return prev;
      }

      return [
        ...prev,
        {
          imei_code: code,
          brand: selectedBrand.name,
          model: selectedModel.name,
          scannedAt: new Date().toISOString(),
          size: selectedStorage.name,
        },
      ];
    });

    setManualBarcode("");
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    addScannedItem(data);

    setTimeout(() => setScanned(false), 700);
  };

  const handleManualEntry = () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter an IMEI/barcode");
      return;
    }
    addScannedItem(manualBarcode);
  };

  const removeScannedItem = (imei: string) => {
    setScannedItems((prev) => prev.filter((item) => item.imei_code !== imei));
  };

  const handleSubmit = async () => {
    if (!auth.isAuthenticated) {
      Alert.alert("Session", "Please login again.");
      return;
    }
    if (!storeId) {
      Alert.alert("Error", "Missing storeId");
      return;
    }
    if (
      !selectedVendor ||
      !selectedBrand ||
      !selectedModel ||
      !selectedStorage
    ) {
      Alert.alert(
        "Selections",
        "Please select vendor, brand, model and storage.",
      );
      return;
    }
    if (scannedItems.length === 0) {
      Alert.alert("Error", "No items to save");
      return;
    }

    try {
      setIsSubmitting(true);

      await purchasesApi.create({
        vendor_id: selectedVendor.id,
        brand_id: selectedBrand.id,
        model_id: selectedModel.id,
        store_id: storeId,
        imei_codes: scannedItems.map((x) => x.imei_code),
        storage_size: selectedStorage.name,
        status: "pending",
        total_price: 0,
        paid_amount: 0,
        payment_status: "unpaid",
      });

      Alert.alert("Saved", `${scannedItems.length} item(s) saved`);
      setScannedItems([]);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (navigation.isReady()) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "StoreSelection" }],
        }),
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Stock Taking</Text>
          {storeName ? (
            <Text style={styles.headerSubtitle}>{storeName}</Text>
          ) : null}
        </View>
        <LogoutButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <VendorSelection
          selectedName={selectedVendor?.name ?? null}
          onPress={() => setShowVendorModal(true)}
        />

        <BrandSelection
          selectedName={selectedBrand?.name ?? null}
          disabled={!selectedVendor}
          onPress={() => {
            if (!selectedVendor) {
              Alert.alert("Info", "Please select vendor first");
              return;
            }
            setShowBrandModal(true);
          }}
        />

        <View style={{ marginTop: 8 }}>
          <Text style={{ marginBottom: 6 }}>Model</Text>
          <TouchableOpacity
            style={[
              styles.selectBtn,
              !selectedBrand && styles.selectBtnDisabled,
            ]}
            disabled={!selectedBrand}
            onPress={() => {
              if (!selectedBrand) {
                Alert.alert("Info", "Please select brand first");
                return;
              }
              setShowModelModal(true);
            }}
          >
            <Text style={{ color: selectedModel ? "#111" : "#999" }}>
              {selectedModel?.name ?? "Select Model"}
            </Text>
          </TouchableOpacity>
        </View>

        <StorageSelection
          selectedStorage={selectedStorage}
          options={storageOptions}
          loading={loadingStorage}
          disabled={!selectedModel}
          onSelect={setSelectedStorage}
        />

        {/* Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanBtn,
            (!selectedModel || !selectedStorage) && styles.scanBtnDisabled,
          ]}
          disabled={!selectedModel || !selectedStorage}
          onPress={requestCameraPermission}
        >
          <Text style={styles.scanBtnText}>📷 Scan Barcode</Text>
        </TouchableOpacity>

        {/* Manual Entry */}
        <View style={styles.manualEntryContainer}>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter IMEI manually"
            placeholderTextColor="#999"
            value={manualBarcode}
            onChangeText={setManualBarcode}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleManualEntry}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Scanned Items List */}
        {scannedItems.length > 0 && (
          <View style={styles.scannedList}>
            <Text style={styles.scannedListTitle}>
              Scanned Items ({scannedItems.length})
            </Text>
            {scannedItems.map((item, index) => (
              <View key={item.imei_code} style={styles.scannedItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scannedImei}>{item.imei_code}</Text>
                  <Text style={styles.scannedMeta}>
                    {item.brand} - {item.model} {item.size}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeScannedItem(item.imei_code)}
                >
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submit Button */}
        {scannedItems.length > 0 && (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting
                ? "Saving..."
                : `Save ${scannedItems.length} Item(s)`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Selection Modals */}
      <SelectionModal<Vendor>
        visible={showVendorModal}
        title="Select Vendor"
        data={filteredVendors}
        loading={loadingVendors}
        searchValue={vendorSearch}
        onSearchChange={setVendorSearch}
        selectedItem={selectedVendor}
        onSelect={setSelectedVendor}
        onClose={() => setShowVendorModal(false)}
      />

      <SelectionModal<Brand>
        visible={showBrandModal}
        title="Select Brand"
        data={filteredBrands}
        loading={loadingBrands}
        searchValue={brandSearch}
        onSearchChange={setBrandSearch}
        selectedItem={selectedBrand}
        onSelect={setSelectedBrand}
        onClose={() => setShowBrandModal(false)}
      />

      <SelectionModal<Model>
        visible={showModelModal}
        title="Select Model"
        data={filteredModels}
        loading={loadingModels}
        searchValue={modelSearch}
        onSearchChange={setModelSearch}
        selectedItem={selectedModel}
        onSelect={setSelectedModel}
        onClose={() => setShowModelModal(false)}
      />

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Text style={styles.scannerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ["code128", "code39", "ean13", "ean8", "qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          <View style={styles.scannerFooter}>
            <Text style={styles.scannerHint}>
              Point camera at barcode to scan
            </Text>
            <Text style={styles.scannedCount}>
              Scanned: {scannedItems.length} item(s)
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.doneBtnText}>Done Scanning</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.85,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
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
  scanBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  scanBtnDisabled: {
    backgroundColor: "#ccc",
  },
  scanBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  manualEntryContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  manualInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  addBtn: {
    padding: 12,
    backgroundColor: "#34C759",
    borderRadius: 8,
    justifyContent: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  scannedList: {
    marginTop: 20,
  },
  scannedListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  scannedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 8,
  },
  scannedImei: {
    fontSize: 14,
    fontWeight: "600",
  },
  scannedMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  removeBtn: {
    fontSize: 18,
    color: "#FF3B30",
    padding: 4,
  },
  submitBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#34C759",
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#ccc",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  scannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  scannerClose: {
    color: "#fff",
    fontSize: 24,
    padding: 4,
  },
  camera: {
    flex: 1,
  },
  scannerFooter: {
    padding: 20,
    backgroundColor: "#111",
    alignItems: "center",
  },
  scannerHint: {
    color: "#aaa",
    marginBottom: 8,
  },
  scannedCount: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  doneBtn: {
    padding: 14,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StockTakingScreen;
