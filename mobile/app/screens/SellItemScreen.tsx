import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { imeiApi, saleApi, categoryApi } from "@/util/api";
import LogoutButton from "@/components/LogoutButton";

/* ─── types ────────────────────────────────────────────────────── */
type RouteParams = {
  storeId?: number;
  storeName?: string;
  companyId?: number;
};

type ImeiInfo = {
  code: string;
  brand: string;
  model: string;
  storage_size: string;
  inStore: boolean;
};

type SaleRecord = {
  id: number;
  imei_code: string;
  brand: string;
  model: string;
  storage: string;
  amount: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  receipt_url: string;
  created_at: string;
};

type Category = {
  id: number;
  name: string;
  type_name?: string;
};

/* ─── component ────────────────────────────────────────────────── */
export default function SellItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName, companyId } = (route.params ?? {}) as RouteParams;

  /* camera */
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  /* IMEI */
  const [imeiCode, setImeiCode] = useState("");
  const [imeiInfo, setImeiInfo] = useState<ImeiInfo | null>(null);
  const [validatingImei, setValidatingImei] = useState(false);

  /* sale fields */
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  /* customer */
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSecondaryPhone, setCustomerSecondaryPhone] = useState("");

  /* next of kin */
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [nextOfKinSecondaryPhone, setNextOfKinSecondaryPhone] = useState("");

  /* relationship dropdown */
  const [relationships, setRelationships] = useState<Category[]>([]);
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  /* receipt attachment */
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  /* submission */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* receipt modal */
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  /* sales history */
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ─── load relationship categories ───────────────────────────── */
  const loadRelationships = useCallback(async () => {
    setLoadingRelationships(true);
    try {
      const items = await categoryApi.listByTypeName("RELATIONSHIP");
      setRelationships(items ?? []);
    } catch (e) {
      console.error("Failed to load relationships:", e);
    } finally {
      setLoadingRelationships(false);
    }
  }, []);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  /* ─── validate IMEI against backend ──────────────────────────── */
  const validateImei = useCallback(
    async (code: string) => {
      if (!code.trim() || !storeId) return;
      setValidatingImei(true);
      setImeiInfo(null);
      try {
        const res = await imeiApi.getByCode(code.trim());
        const imei = res.data;
        if (!imei) {
          Alert.alert(
            "Not Found",
            `IMEI ${code} does not exist in the database.`,
          );
          return;
        }
        const stores: any[] = imei.stores || [];
        const inStore = stores.some(
          (s: any) => Number(s.id) === Number(storeId),
        );
        const info: ImeiInfo = {
          code: imei.code,
          brand: imei.brand || "",
          model: imei.model || "",
          storage_size: imei.storage_size || "",
          inStore,
        };
        setImeiInfo(info);
        if (!inStore) {
          Alert.alert(
            "Not in Store",
            `IMEI ${code} is not available in ${storeName}. Cannot sell.`,
          );
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ?? e?.message ?? "Failed to look up IMEI";
        Alert.alert("Error", msg);
      } finally {
        setValidatingImei(false);
      }
    },
    [storeId, storeName],
  );

  /* ─── barcode scan ───────────────────────────────────────────── */
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setImeiCode(data);
    setShowScanner(false);
    setTimeout(() => setScanned(false), 700);
    validateImei(data);
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission", "Camera permission is required to scan.");
        return;
      }
    }
    setShowScanner(true);
  };

  const handleImeiBlur = () => {
    if (imeiCode.trim()) validateImei(imeiCode);
  };

  /* ─── pick receipt image ─────────────────────────────────────── */
  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takeReceiptPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Camera permission is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  /* ─── can submit guard ───────────────────────────────────────── */
  const canSubmit = useMemo(() => {
    return (
      Boolean(storeId) &&
      Boolean(imeiCode.trim()) &&
      Boolean(imeiInfo?.inStore) &&
      Boolean(amount.trim()) &&
      !Number.isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      Boolean(customerName.trim()) &&
      Boolean(customerPhone.trim())
    );
  }, [storeId, imeiCode, imeiInfo, amount, customerName, customerPhone]);

  /* ─── load sales history ─────────────────────────────────────── */
  const loadHistory = useCallback(async () => {
    if (!storeId) return;
    setLoadingHistory(true);
    try {
      const res = await saleApi.getAll({ store_id: storeId, pageSize: 100 });
      const items = res.data?.data ?? res.data ?? [];
      setSales(items);
    } catch (e) {
      console.error("Failed to load sales history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /* ─── submit sale ────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!canSubmit || !storeId) return;
    setIsSubmitting(true);
    try {
      const res = await saleApi.create({
        store_id: storeId,
        store_name: storeName ?? "",
        imei_code: imeiCode.trim(),
        brand: imeiInfo?.brand ?? "",
        model: imeiInfo?.model ?? "",
        storage: imeiInfo?.storage_size ?? "",
        amount: Number(amount),
        notes: notes.trim(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_secondary_phone: customerSecondaryPhone.trim(),
        next_of_kin_name: nextOfKinName.trim(),
        next_of_kin_relationship: nextOfKinRelationship.trim(),
        next_of_kin_phone: nextOfKinPhone.trim(),
        next_of_kin_secondary_phone: nextOfKinSecondaryPhone.trim(),
      });

      const sale = res.data;

      // Upload receipt if attached
      if (receiptUri && sale.id) {
        try {
          const filename = receiptUri.split("/").pop() || "receipt.jpg";
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          await saleApi.uploadReceipt(sale.id, {
            uri: receiptUri,
            name: filename,
            type: mimeType,
          });
        } catch (e) {
          console.error("Receipt upload failed:", e);
          Alert.alert("Note", "Sale completed but receipt upload failed.");
        }
      }

      setLastSale(sale);
      setShowReceipt(true);

      // Reset form
      setImeiCode("");
      setImeiInfo(null);
      setAmount("");
      setNotes("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerSecondaryPhone("");
      setNextOfKinName("");
      setNextOfKinRelationship("");
      setNextOfKinPhone("");
      setNextOfKinSecondaryPhone("");
      setReceiptUri(null);

      loadHistory();
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ?? e?.message ?? "Failed to complete sale";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "#4CAF50";
    if (s === "cancelled") return "#999";
    return "#FF9800";
  };

  /* ─── render ─────────────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sell Item</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <Ionicons name="receipt-outline" size={24} color="#fff" />
          {sales.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{sales.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <LogoutButton />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ── Scan IMEI Card ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Scan IMEI</Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleOpenScanner}
          >
            <Ionicons name="barcode-outline" size={18} color="#fff" />
            <Text style={styles.scanButtonText}>Scan IMEI</Text>
          </TouchableOpacity>

          <Text style={styles.label}>IMEI Code</Text>
          <TextInput
            value={imeiCode}
            onChangeText={setImeiCode}
            onBlur={handleImeiBlur}
            placeholder="Scan or enter IMEI code"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            style={styles.input}
          />

          {validatingImei && (
            <View style={styles.infoRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.infoText}> Validating IMEI…</Text>
            </View>
          )}

          {imeiInfo && (
            <View
              style={[
                styles.imeiInfoBox,
                { borderColor: imeiInfo.inStore ? "#4CAF50" : "#f44336" },
              ]}
            >
              <Text style={styles.imeiInfoTitle}>
                {imeiInfo.inStore
                  ? "✅ Available in store"
                  : "❌ Not in this store"}
              </Text>
              <Text style={styles.imeiInfoLine}>Brand: {imeiInfo.brand}</Text>
              <Text style={styles.imeiInfoLine}>Model: {imeiInfo.model}</Text>
              <Text style={styles.imeiInfoLine}>
                Storage: {imeiInfo.storage_size || "N/A"}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Sale amount"
            placeholderTextColor="#999"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* ── Customer Card ──────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Customer</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.label}>Primary Phone *</Text>
          <TextInput
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Primary phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Secondary Phone</Text>
          <TextInput
            value={customerSecondaryPhone}
            onChangeText={setCustomerSecondaryPhone}
            placeholder="Secondary phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Sale notes (optional)"
            placeholderTextColor="#999"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        {/* ── Next of Kin Card ───────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👨‍👩‍👧 Next of Kin</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={nextOfKinName}
            onChangeText={setNextOfKinName}
            placeholder="Next of kin name"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.label}>Relationship</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowRelationshipDropdown(true)}
          >
            <Text
              style={[
                styles.dropdownButtonText,
                !nextOfKinRelationship && styles.dropdownPlaceholder,
              ]}
            >
              {nextOfKinRelationship || "Select relationship"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Primary Phone</Text>
          <TextInput
            value={nextOfKinPhone}
            onChangeText={setNextOfKinPhone}
            placeholder="Next of kin phone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Secondary Phone</Text>
          <TextInput
            value={nextOfKinSecondaryPhone}
            onChangeText={setNextOfKinSecondaryPhone}
            placeholder="Next of kin secondary phone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {/* ── Receipt Attachment Card ────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Receipt Attachment</Text>

          <View style={styles.receiptButtons}>
            <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt}>
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={styles.receiptBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.receiptBtn}
              onPress={takeReceiptPhoto}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.receiptBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {receiptUri && (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
              <TouchableOpacity
                style={styles.removeReceiptBtn}
                onPress={() => setReceiptUri(null)}
              >
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Submit Button ──────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.primaryButtonText}>Complete Sale</Text>
            </>
          )}
        </TouchableOpacity>

        {!storeId && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              No store selected. Go back and select a store.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ═══════════════ Relationship Dropdown Modal ═══════════════ */}
      <Modal
        visible={showRelationshipDropdown}
        animationType="slide"
        transparent
      >
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Relationship</Text>
              <TouchableOpacity
                onPress={() => setShowRelationshipDropdown(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingRelationships ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginVertical: 30 }}
              />
            ) : relationships.length === 0 ? (
              <View style={styles.dropdownEmpty}>
                <Ionicons name="alert-circle-outline" size={36} color="#ccc" />
                <Text style={styles.dropdownEmptyText}>
                  No relationships found
                </Text>
              </View>
            ) : (
              <FlatList
                data={relationships}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      nextOfKinRelationship === item.name &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setNextOfKinRelationship(item.name);
                      setShowRelationshipDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        nextOfKinRelationship === item.name &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {nextOfKinRelationship === item.name && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Clear selection option */}
            {nextOfKinRelationship ? (
              <TouchableOpacity
                style={styles.dropdownClearBtn}
                onPress={() => {
                  setNextOfKinRelationship("");
                  setShowRelationshipDropdown(false);
                }}
              >
                <Text style={styles.dropdownClearText}>Clear Selection</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ═══════════════ Scanner Modal ═══════════════ */}
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
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ═══════════════ Receipt / Success Modal ═══════════════ */}
      <Modal visible={showReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Sale Completed!</Text>
            {lastSale && (
              <View style={styles.receiptDetails}>
                <Text style={styles.receiptLine}>Store: {storeName}</Text>
                <Text style={styles.receiptLine}>
                  IMEI: {lastSale.imei_code}
                </Text>
                <Text style={styles.receiptLine}>
                  Brand: {lastSale.brand} | Model: {lastSale.model}
                </Text>
                <Text style={styles.receiptLine}>
                  Storage: {lastSale.storage || "N/A"}
                </Text>
                <Text style={styles.receiptLine}>
                  Amount: {lastSale.amount}
                </Text>
                <Text style={styles.receiptLine}>
                  Customer: {lastSale.customer_name}
                </Text>
                <Text style={styles.receiptLine}>
                  Phone: {lastSale.customer_phone}
                </Text>
                <Text style={styles.receiptLine}>
                  Date: {new Date(lastSale.created_at).toLocaleString()}
                </Text>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor(lastSale.status) },
                    ]}
                  >
                    {lastSale.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 16 }]}
              onPress={() => setShowReceipt(false)}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ Sales History Modal ═══════════════ */}
      <Modal visible={showHistory} animationType="slide">
        <SafeAreaView style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Sales History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={styles.scannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {loadingHistory ? (
            <ActivityIndicator size="large" style={{ marginTop: 40 }} />
          ) : sales.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No sales yet</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
            >
              {sales.map((s) => (
                <View key={s.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>#{s.id}</Text>
                    <View
                      style={[
                        styles.historyBadge,
                        { backgroundColor: statusColor(s.status) },
                      ]}
                    >
                      <Text style={styles.historyBadgeText}>{s.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyLine}>IMEI: {s.imei_code}</Text>
                  <Text style={styles.historyLine}>
                    {s.brand} {s.model} {s.storage ? `(${s.storage})` : ""}
                  </Text>
                  <Text style={styles.historyLine}>Amount: {s.amount}</Text>
                  <Text style={styles.historyLine}>
                    Customer: {s.customer_name}
                  </Text>
                  <Text style={styles.historyLine}>
                    {new Date(s.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/* ─── styles ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#FF5722",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15, padding: 5 },
  headerContent: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 16, color: "#fff", opacity: 0.85, marginTop: 5 },
  historyButton: { padding: 5, position: "relative" },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#FFC107",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#333", fontSize: 10, fontWeight: "bold" },

  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 28 },

  card: {
    backgroundColor: "#fff",
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
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },

  scanButton: {
    backgroundColor: "#007AFF",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoText: { color: "#555", fontSize: 14 },

  imeiInfoBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },
  imeiInfoTitle: { fontWeight: "700", fontSize: 14, marginBottom: 6 },
  imeiInfoLine: { fontSize: 13, color: "#555", marginBottom: 2 },

  /* dropdown styles */
  dropdownButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownPlaceholder: {
    color: "#999",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  dropdownEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  dropdownEmptyText: {
    color: "#999",
    fontSize: 14,
    marginTop: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dropdownClearBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  dropdownClearText: {
    color: "#f44336",
    fontSize: 15,
    fontWeight: "600",
  },

  receiptButtons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  receiptBtn: {
    flex: 1,
    backgroundColor: "#607D8B",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  receiptBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  receiptPreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  receiptImage: { width: "100%", height: 200, resizeMode: "cover" },
  removeReceiptBtn: { position: "absolute", top: 8, right: 8 },

  primaryButton: {
    backgroundColor: "#FF5722",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  notice: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffeeba",
  },
  noticeText: { color: "#856404" },

  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  scannerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  scannerClose: { color: "#fff", fontSize: 22, fontWeight: "800" },
  camera: { flex: 1 },
  scannerFooter: { padding: 16, backgroundColor: "#111" },
  scannerHint: { color: "#ddd", marginBottom: 12 },
  doneBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontWeight: "800" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  receiptDetails: { gap: 4 },
  receiptLine: { fontSize: 14, color: "#444" },
  statusBadge: { marginTop: 8, alignItems: "flex-start" },
  statusText: { fontWeight: "700", fontSize: 14 },

  historyContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FF5722",
  },
  historyTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16, marginTop: 10 },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyLabel: { fontWeight: "700", fontSize: 14, color: "#333" },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  historyBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historyLine: { fontSize: 13, color: "#555", marginBottom: 2 },
});
