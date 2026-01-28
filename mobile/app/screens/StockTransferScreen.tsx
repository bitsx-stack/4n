import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation, useRoute } from "@react-navigation/native";

import SelectionModal, { NamedItem } from "./SelectionModal";
import { categoryApi, categoryTypeApi, storesApi } from "@/util/api";

type RouteParams = {
  storeId?: number;
  storeName?: string;
  companyId?: number;
};

type StoreItem = NamedItem;
type BrandItem = NamedItem;
type ModelItem = NamedItem & { categorytype_id: number };

type RequestLine = {
  id: string;
  toStore: StoreItem;
  brand: BrandItem;
  model: ModelItem;
  quantity: number;
  scannedImeis: string[];
};

export default function StockTransferScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName, companyId } = (route.params ?? {}) as RouteParams;

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  const [lines, setLines] = useState<RequestLine[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // Draft request line
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [storeSearch, setStoreSearch] = useState<string>("");
  const [draftToStore, setDraftToStore] = useState<StoreItem | null>(null);

  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [draftBrand, setDraftBrand] = useState<BrandItem | null>(null);

  const [showModelModal, setShowModelModal] = useState<boolean>(false);
  const [modelSearch, setModelSearch] = useState<string>("");
  const [draftModel, setDraftModel] = useState<ModelItem | null>(null);

  const [draftQuantity, setDraftQuantity] = useState<string>("1");

  // Scanner + manual entry
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [manualImei, setManualImei] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleBack = () => navigation.goBack();

  const loadStores = async () => {
    if (!companyId) return;
    setLoadingStores(true);
    try {
      const res = await storesApi.getStoresByCompany(companyId);
      const list: any[] = res.data ?? [];
      const mapped: StoreItem[] = list
        .map((s) => ({ id: Number(s.id), name: String(s.name) }))
        .filter((s) => Number.isFinite(s.id) && s.name);

      setStores(mapped.filter((s) => s.id !== storeId));
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [brandList, modelList] = await Promise.all([
        categoryTypeApi.listAll(),
        categoryApi.listAll(),
      ]);

      setBrands(
        (brandList ?? [])
          .map((b: any) => ({ id: Number(b.id), name: String(b.name) }))
          .filter((b) => Number.isFinite(b.id) && b.name),
      );

      setModels(
        (modelList ?? [])
          .map((m: any) => ({
            id: Number(m.id),
            name: String(m.name),
            categorytype_id: Number(m.categorytype_id),
          }))
          .filter(
            (m) =>
              Number.isFinite(m.id) &&
              m.name &&
              Number.isFinite(m.categorytype_id),
          ),
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load brands/models");
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadStores();
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, storeId]);

  useEffect(() => {
    setDraftModel(null);
    setModelSearch("");
  }, [draftBrand?.id]);

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => s.name.toLowerCase().includes(q));
  }, [storeSearch, stores]);

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandSearch, brands]);

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    const byBrand = draftBrand
      ? models.filter((m) => m.categorytype_id === draftBrand.id)
      : [];
    if (!q) return byBrand;
    return byBrand.filter((m) => m.name.toLowerCase().includes(q));
  }, [modelSearch, models, draftBrand]);

  const addRequestLine = () => {
    if (!draftToStore || !draftBrand || !draftModel) {
      Alert.alert("Missing info", "Select store, brand and model.");
      return;
    }
    const qty = Number(draftQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert("Invalid quantity", "Enter a valid quantity.");
      return;
    }

    const newLine: RequestLine = {
      id: String(Date.now()),
      toStore: draftToStore,
      brand: draftBrand,
      model: draftModel,
      quantity: qty,
      scannedImeis: [],
    };

    setLines((prev) => [newLine, ...prev]);
    setActiveLineId(newLine.id);
    setDraftBrand(null);
    setDraftModel(null);
    setDraftQuantity("1");
  };

  const updateLineQuantity = (lineId: string, value: string) => {
    const nextQty = Number(value);
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const qty = Number.isFinite(nextQty) && nextQty > 0 ? nextQty : 0;
        const trimmed = qty > 0 ? l.scannedImeis.slice(0, qty) : [];
        return { ...l, quantity: qty, scannedImeis: trimmed };
      }),
    );
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    if (activeLineId === lineId) setActiveLineId(null);
  };

  const addImeiToActiveLine = (raw: string) => {
    const code = raw.trim();
    if (!code) {
      Alert.alert("Missing IMEI", "Scan or enter an IMEI.");
      return;
    }
    if (!activeLineId) {
      Alert.alert("Select request", "Tap a request line first.");
      return;
    }

    setLines((prev) => {
      const active = prev.find((l) => l.id === activeLineId);
      if (!active) return prev;
      if (active.scannedImeis.includes(code)) {
        Alert.alert(
          "Duplicate",
          "This IMEI is already scanned for this request.",
        );
        return prev;
      }
      if (
        active.quantity > 0 &&
        active.scannedImeis.length >= active.quantity
      ) {
        Alert.alert(
          "Quantity reached",
          "Scanned count already matches the requested quantity.",
        );
        return prev;
      }
      return prev.map((l) =>
        l.id === activeLineId
          ? { ...l, scannedImeis: [code, ...l.scannedImeis] }
          : l,
      );
    });
  };

  const removeImeiFromLine = (lineId: string, imei: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, scannedImeis: l.scannedImeis.filter((x) => x !== imei) }
          : l,
      ),
    );
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    addImeiToActiveLine(data);

    setTimeout(() => setScanned(false), 700);
  };

  const handleOpenScanner = async () => {
    if (!activeLineId) {
      Alert.alert("Select request", "Tap a request line first.");
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission", "Camera permission is required to scan.");
        return;
      }
    }
    setShowScanner(true);
  };

  const canSubmit = useMemo(() => {
    if (!storeId) return false;
    if (lines.length === 0) return false;
    return lines.every(
      (l) => l.quantity > 0 && l.scannedImeis.length === l.quantity,
    );
  }, [storeId, lines]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Not ready",
        "Each request line must have scanned IMEIs equal to quantity.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      // Design-only: backend wiring can be added once stock-request + transfer endpoints are confirmed.
      const total = lines.reduce((sum, l) => sum + l.scannedImeis.length, 0);
      Alert.alert(
        "Transfer prepared",
        `From: ${storeName ?? storeId}\nRequests: ${lines.length}\nIMEIs: ${total}`,
      );
      setLines([]);
      setActiveLineId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeLine = useMemo(() => {
    if (!activeLineId) return null;
    return lines.find((l) => l.id === activeLineId) ?? null;
  }, [activeLineId, lines]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Stock Transfer</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Request</Text>

          <Text style={styles.label}>Requested Store</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowStoreModal(true)}
            disabled={loadingStores || !companyId}
          >
            <Text style={styles.selectButtonText}>
              {draftToStore?.name ??
                (loadingStores
                  ? "Loading stores..."
                  : "Select requested store")}
            </Text>
            {loadingStores ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Brand</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowBrandModal(true)}
            disabled={loadingCatalog}
          >
            <Text style={styles.selectButtonText}>
              {draftBrand?.name ??
                (loadingCatalog ? "Loading..." : "Select brand")}
            </Text>
            {loadingCatalog ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Model</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              if (!draftBrand) {
                Alert.alert("Info", "Select brand first.");
                return;
              }
              setShowModelModal(true);
            }}
            disabled={loadingCatalog || !draftBrand}
          >
            <Text style={styles.selectButtonText}>
              {draftModel?.name ??
                (draftBrand
                  ? loadingCatalog
                    ? "Loading..."
                    : "Select model"
                  : "Select brand first")}
            </Text>
            {loadingCatalog ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            value={draftQuantity}
            onChangeText={setDraftQuantity}
            placeholder="1"
            placeholderTextColor="#999"
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={addRequestLine}
          >
            <Ionicons name="add-circle-outline" size={18} color="#1565c0" />
            <Text style={styles.secondaryButtonText}>Add Request Line</Text>
          </TouchableOpacity>

          {!companyId ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Missing companyId. Navigate from Actions to preserve params.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request Lines</Text>
          {lines.length === 0 ? (
            <Text style={styles.helperText}>No request lines yet.</Text>
          ) : (
            <View style={{ marginTop: 6 }}>
              {lines.map((l) => {
                const isActive = l.id === activeLineId;
                const fulfilled =
                  l.quantity > 0 && l.scannedImeis.length === l.quantity;
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[
                      styles.lineRow,
                      isActive && styles.lineRowActive,
                      fulfilled && styles.lineRowFulfilled,
                    ]}
                    onPress={() => setActiveLineId(l.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineTitle}>
                        {l.toStore.name} • {l.brand.name} • {l.model.name}
                      </Text>
                      <Text style={styles.lineMeta}>
                        Scanned: {l.scannedImeis.length}/{l.quantity}
                      </Text>
                    </View>
                    <View style={styles.lineQtyBox}>
                      <TextInput
                        value={String(l.quantity || "")}
                        onChangeText={(v) => updateLineQuantity(l.id, v)}
                        keyboardType="numeric"
                        style={styles.lineQtyInput}
                      />
                      <Text style={styles.lineQtyLabel}>Qty</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeLine(l.id)}
                      style={styles.iconButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan IMEIs to Transfer</Text>

          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Active Request</Text>
            <Text style={styles.kvValue}>
              {activeLine
                ? `${activeLine.toStore.name} • ${activeLine.model.name}`
                : "(tap a request line)"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleOpenScanner}
            disabled={!activeLineId}
          >
            <Ionicons name="barcode-outline" size={18} color="#fff" />
            <Text style={styles.primaryActionText}>Scan IMEI</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Manual IMEI (optional)</Text>
          <View style={styles.manualRow}>
            <TextInput
              value={manualImei}
              onChangeText={setManualImei}
              placeholder="Enter IMEI"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <TouchableOpacity
              style={styles.manualAddButton}
              onPress={() => {
                addImeiToActiveLine(manualImei);
                setManualImei("");
              }}
              disabled={!activeLineId}
            >
              <Ionicons name="add" size={20} color="#1565c0" />
            </TouchableOpacity>
          </View>

          {!activeLine ? (
            <Text style={styles.helperText}>
              Select a request line to start scanning.
            </Text>
          ) : activeLine.scannedImeis.length === 0 ? (
            <Text style={styles.helperText}>
              No IMEIs scanned for this line.
            </Text>
          ) : (
            <View style={{ marginTop: 12 }}>
              {activeLine.scannedImeis.map((code) => (
                <View key={code} style={styles.listRow}>
                  <Text style={styles.listPrimary}>{code}</Text>
                  <TouchableOpacity
                    onPress={() => removeImeiFromLine(activeLine.id, code)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Transfer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <SelectionModal<StoreItem>
        visible={showStoreModal}
        title="Stores"
        data={filteredStores}
        loading={loadingStores}
        searchValue={storeSearch}
        onSearchChange={setStoreSearch}
        selectedItem={draftToStore}
        onSelect={(it) => {
          setDraftToStore(it);
          setShowStoreModal(false);
        }}
        onClose={() => setShowStoreModal(false)}
      />

      <SelectionModal<BrandItem>
        visible={showBrandModal}
        title="Brands"
        data={filteredBrands}
        loading={loadingCatalog}
        searchValue={brandSearch}
        onSearchChange={setBrandSearch}
        selectedItem={draftBrand}
        onSelect={(it) => {
          setDraftBrand(it);
          setShowBrandModal(false);
        }}
        onClose={() => setShowBrandModal(false)}
      />

      <SelectionModal<ModelItem>
        visible={showModelModal}
        title="Models"
        data={filteredModels}
        loading={loadingCatalog}
        searchValue={modelSearch}
        onSearchChange={setModelSearch}
        selectedItem={draftModel}
        onSelect={(it) => {
          setDraftModel(it);
          setShowModelModal(false);
        }}
        onClose={() => setShowModelModal(false)}
      />

      <Modal visible={showScanner} animationType="slide">
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan IMEI</Text>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15, padding: 5 },
  headerContent: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", color: "#ffffff" },
  subtitle: { fontSize: 16, color: "#ffffff", opacity: 0.85, marginTop: 5 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 8 },
  input: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectButtonText: { fontSize: 16, color: "#333", flex: 1, marginRight: 10 },
  secondaryButton: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#90caf9",
    backgroundColor: "#e3f2fd",
  },
  secondaryButtonText: { color: "#1565c0", fontWeight: "700" },
  helperText: { marginTop: 8, color: "#666" },
  notice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffeeba",
  },
  noticeText: { color: "#856404" },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  lineRowActive: { borderColor: "#2196F3" },
  lineRowFulfilled: { backgroundColor: "#ecfdf5", borderColor: "#10b981" },
  lineTitle: { fontWeight: "800", color: "#111" },
  lineMeta: { marginTop: 4, color: "#666" },
  lineQtyBox: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  lineQtyInput: {
    width: 60,
    textAlign: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: "800",
    color: "#111",
  },
  lineQtyLabel: { marginTop: 4, fontSize: 11, color: "#666" },
  iconButton: { marginLeft: 10, padding: 6 },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  kvKey: { color: "#666", fontWeight: "700" },
  kvValue: { color: "#111", fontWeight: "800" },
  primaryActionButton: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    opacity: 1,
  },
  primaryActionText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  manualAddButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#90caf9",
    alignItems: "center",
    justifyContent: "center",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  listPrimary: { fontWeight: "800", color: "#111" },
  submitButton: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // scanner
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  scannerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  scannerClose: { color: "#fff", fontSize: 18, fontWeight: "800" },
  camera: { flex: 1 },
  scannerFooter: {
    padding: 16,
    backgroundColor: "#111",
  },
  scannerHint: { color: "#ddd", marginBottom: 12 },
  doneBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontWeight: "800" },
});
