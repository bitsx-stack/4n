import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { imeiApi, stockRequestApi } from "@/util/api";
import LogoutButton from "@/components/LogoutButton";

/* ─── types ────────────────────────────────────────────────────────── */
type RouteParams = { storeId?: number; storeName?: string; companyId?: number };

type StockRequestItem = {
  id: number;
  source_store_id: number;
  source_store_name: string;
  destination_store_id: number;
  destination_store_name: string;
  brand: string;
  model: string;
  storage: string;
  requested_quantity: number;
  available_stock: number;
  moved_quantity: number;
  status: string;
  notes: string;
  requested_imeis: string[];
  transferred_imeis: string[];
  received_imeis: string[];
  created_at: string;
  updated_at: string;
};

/* ─── component ────────────────────────────────────────────────────── */
export default function StockTransferScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName } = (route.params ?? {}) as RouteParams;

  /* pending requests where THIS store is the source (warehouse) */
  const [requests, setRequests] = useState<StockRequestItem[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  /* the request currently being fulfilled */
  const [activeReq, setActiveReq] = useState<StockRequestItem | null>(null);

  /* editable transfer quantity (≤ requested_quantity) */
  const [transferQty, setTransferQty] = useState("");

  /* scanned IMEIs for the active transfer */
  const [scannedImeis, setScannedImeis] = useState<string[]>([]);

  /* scanner state */
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualImei, setManualImei] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── load pending requests ───────────────────────────────────── */
  const loadRequests = useCallback(async () => {
    if (!storeId) return;
    setLoadingReqs(true);
    try {
      const res = await stockRequestApi.getByStore(storeId);
      const items: StockRequestItem[] = res.data?.data ?? res.data ?? [];
      // Show only pending requests where this store is the SOURCE
      setRequests(
        items.filter(
          (r) => r.source_store_id === storeId && r.status === "pending",
        ),
      );
    } catch (e) {
      console.error("Failed to load requests:", e);
    } finally {
      setLoadingReqs(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* ─── select a request to fulfil ─────────────────────────────── */
  const selectRequest = (req: StockRequestItem) => {
    setActiveReq(req);
    setTransferQty(String(req.requested_quantity));
    setScannedImeis([]);
    setManualImei("");
  };

  const clearSelection = () => {
    setActiveReq(null);
    setTransferQty("");
    setScannedImeis([]);
    setManualImei("");
  };

  /* ─── quantity guard ──────────────────────────────────────────── */
  const maxQty = activeReq?.requested_quantity ?? 0;
  const parsedQty = Number(transferQty) || 0;

  const handleQtyChange = (val: string) => {
    const n = Number(val);
    if (val === "") {
      setTransferQty("");
      return;
    }
    if (!Number.isFinite(n) || n < 0) return;
    if (n > maxQty) {
      Alert.alert("Limit", `Cannot exceed requested quantity (${maxQty}).`);
      return;
    }
    setTransferQty(val);
  };

  /* ─── IMEI scanning ──────────────────────────────────────────── */
  const addImei = async (raw: string) => {
    const code = raw.trim();
    if (!code || !activeReq) return;

    // Already scanned?
    if (scannedImeis.includes(code)) {
      Alert.alert("Duplicate", "This IMEI is already scanned.");
      return;
    }

    // Reached quantity?
    if (parsedQty > 0 && scannedImeis.length >= parsedQty) {
      Alert.alert(
        "Limit",
        "Scanned count already matches the transfer quantity.",
      );
      return;
    }

    // Validate against DB: IMEI must exist in this source store
    try {
      const res = await imeiApi.getByCode(code);
      const imei = res.data?.data ?? res.data;
      if (!imei || !imei.code) {
        Alert.alert("Not found", `IMEI ${code} not found in database.`);
        return;
      }
      // Check brand / model match
      if (imei.brand?.toLowerCase() !== activeReq.brand.toLowerCase()) {
        Alert.alert(
          "Brand mismatch",
          `IMEI brand "${imei.brand}" does not match "${activeReq.brand}".`,
        );
        return;
      }
      if (imei.model?.toLowerCase() !== activeReq.model.toLowerCase()) {
        Alert.alert(
          "Model mismatch",
          `IMEI model "${imei.model}" does not match "${activeReq.model}".`,
        );
        return;
      }
    } catch {
      Alert.alert("Error", `Could not verify IMEI ${code} in database.`);
      return;
    }

    setScannedImeis((prev) => [...prev, code]);
  };

  const removeImei = (code: string) =>
    setScannedImeis((prev) => prev.filter((c) => c !== code));

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    addImei(data);
    setTimeout(() => setScanned(false), 700);
  };

  const openScanner = async () => {
    if (!activeReq) {
      Alert.alert("Select request", "Select a stock request first.");
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission", "Camera permission is required.");
        return;
      }
    }
    setShowScanner(true);
  };

  /* ─── submit transfer ─────────────────────────────────────────── */
  const canSubmit = useMemo(() => {
    if (!activeReq) return false;
    if (scannedImeis.length === 0) return false;
    if (parsedQty <= 0) return false;
    return scannedImeis.length === parsedQty;
  }, [activeReq, scannedImeis, parsedQty]);

  const handleSubmit = async () => {
    if (!canSubmit || !activeReq) return;
    try {
      setIsSubmitting(true);
      await stockRequestApi.executeTransfer(activeReq.id, {
        transferred_imeis: scannedImeis,
        quantity: parsedQty,
      });
      Alert.alert(
        "Transfer Complete",
        `${scannedImeis.length} IMEI(s) transferred to ${activeReq.destination_store_name}.\nThe destination store can now receive them.`,
      );
      clearSelection();
      await loadRequests();
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Transfer failed";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── helpers ─────────────────────────────────────────────────── */
  const handleBack = () => navigation.goBack();

  const getStatusColor = (s: string) => {
    switch (s) {
      case "pending":
        return "#fff3cd";
      case "transferred":
        return "#cce5ff";
      case "completed":
        return "#d4edda";
      default:
        return "#e0e0e0";
    }
  };

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Stock Transfer</Text>
          {storeName ? <Text style={s.subtitle}>{storeName}</Text> : null}
        </View>
        <LogoutButton />
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
        {/* ── Pending requests card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            Pending Requests{" "}
            {requests.length > 0 && (
              <Text style={{ color: "#007AFF" }}>({requests.length})</Text>
            )}
          </Text>

          {loadingReqs ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : requests.length === 0 ? (
            <Text style={s.helper}>
              No pending stock requests for this store.
            </Text>
          ) : (
            requests.map((req) => {
              const isActive = activeReq?.id === req.id;
              return (
                <TouchableOpacity
                  key={req.id}
                  style={[
                    s.reqRow,
                    isActive && { borderColor: "#2196F3", borderWidth: 2 },
                  ]}
                  onPress={() => selectRequest(req)}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={s.reqTitle}>
                        {req.brand} {req.model}
                      </Text>
                      <View
                        style={[
                          s.statusBadge,
                          { backgroundColor: getStatusColor(req.status) },
                        ]}
                      >
                        <Text style={s.statusText}>{req.status}</Text>
                      </View>
                    </View>
                    <Text style={s.reqMeta}>
                      {req.storage} • Qty: {req.requested_quantity}
                    </Text>
                    <Text style={[s.reqMeta, { color: "#999", fontSize: 11 }]}>
                      To: {req.destination_store_name}
                    </Text>
                    <Text style={[s.reqMeta, { color: "#bbb", fontSize: 10 }]}>
                      {new Date(req.created_at).toLocaleDateString()}{" "}
                      {new Date(req.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {req.notes ? (
                      <Text style={[s.reqMeta, { fontStyle: "italic" }]}>
                        Note: {req.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={isActive ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={isActive ? "#2196F3" : "#ccc"}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Transfer form (visible when a request is selected) ── */}
        {activeReq && (
          <>
            <View style={s.card}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={s.cardTitle}>Transfer Details</Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Ionicons name="close-circle" size={22} color="#999" />
                </TouchableOpacity>
              </View>

              <View style={s.kvRow}>
                <Text style={s.kvKey}>From</Text>
                <Text style={s.kvVal}>
                  {storeName ?? activeReq.source_store_name}
                </Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>To</Text>
                <Text style={s.kvVal}>{activeReq.destination_store_name}</Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Brand</Text>
                <Text style={s.kvVal}>{activeReq.brand}</Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Model</Text>
                <Text style={s.kvVal}>{activeReq.model}</Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Storage</Text>
                <Text style={s.kvVal}>{activeReq.storage}</Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Requested</Text>
                <Text style={s.kvVal}>{activeReq.requested_quantity}</Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Available</Text>
                <Text style={s.kvVal}>{activeReq.available_stock}</Text>
              </View>

              <Text style={s.label}>Transfer Quantity (max {maxQty})</Text>
              <TextInput
                value={transferQty}
                onChangeText={handleQtyChange}
                keyboardType="numeric"
                style={s.input}
                placeholder={`1 - ${maxQty}`}
                placeholderTextColor="#999"
              />
            </View>

            {/* ── Scan IMEIs ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>
                Scan IMEIs ({scannedImeis.length}/{parsedQty || "?"})
              </Text>

              <TouchableOpacity style={s.primaryBtn} onPress={openScanner}>
                <Ionicons name="barcode-outline" size={18} color="#fff" />
                <Text style={s.primaryBtnText}>Scan IMEI</Text>
              </TouchableOpacity>

              <Text style={s.label}>Manual IMEI (optional)</Text>
              <View style={s.manualRow}>
                <TextInput
                  value={manualImei}
                  onChangeText={setManualImei}
                  placeholder="Enter IMEI"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                />
                <TouchableOpacity
                  style={s.manualAdd}
                  onPress={() => {
                    addImei(manualImei);
                    setManualImei("");
                  }}
                >
                  <Ionicons name="add" size={20} color="#1565c0" />
                </TouchableOpacity>
              </View>

              {scannedImeis.length === 0 ? (
                <Text style={s.helper}>No IMEIs scanned yet.</Text>
              ) : (
                <View style={{ marginTop: 12 }}>
                  {scannedImeis.map((code) => (
                    <View key={code} style={s.imeiRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#4CAF50"
                      />
                      <Text style={s.imeiCode}>{code}</Text>
                      <TouchableOpacity onPress={() => removeImei(code)}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#f44336"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[
                s.submitBtn,
                (!canSubmit || isSubmitting) && s.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={s.submitBtnText}>
                {isSubmitting
                  ? "Transferring..."
                  : `Transfer ${scannedImeis.length} IMEI(s)`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Scanner modal ── */}
      <Modal visible={showScanner} animationType="slide">
        <SafeAreaView style={s.scannerWrap}>
          <View style={s.scannerHead}>
            <Text style={s.scannerTitle}>Scan IMEI</Text>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Text style={s.scannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <CameraView
            style={s.camera}
            barcodeScannerSettings={{
              barcodeTypes: ["code128", "code39", "ean13", "ean8", "qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcode}
          />
          <View style={s.scannerFoot}>
            <Text style={s.scannerHint}>Point camera at barcode</Text>
            <TouchableOpacity
              style={s.doneBtn}
              onPress={() => setShowScanner(false)}
            >
              <Text style={s.doneBtnText}>Done Scanning</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/* ─── styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: 15, padding: 5 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 16, color: "#fff", opacity: 0.85, marginTop: 5 },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 28 },
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
  helper: { marginTop: 8, color: "#666" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  kvKey: { color: "#666", fontWeight: "600" },
  kvVal: { color: "#111", fontWeight: "700" },

  /* request rows */
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reqTitle: { fontWeight: "800", color: "#111" },
  reqMeta: { marginTop: 4, color: "#666" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },

  /* imei rows */
  imeiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  imeiCode: { flex: 1, fontFamily: "monospace", fontSize: 14, color: "#333" },

  /* buttons */
  primaryBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  submitBtn: {
    backgroundColor: "#FF9800",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  manualAdd: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#90caf9",
    alignItems: "center",
    justifyContent: "center",
  },

  /* scanner */
  scannerWrap: { flex: 1, backgroundColor: "#000" },
  scannerHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  scannerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  scannerClose: { color: "#fff", fontSize: 18, fontWeight: "800" },
  camera: { flex: 1 },
  scannerFoot: { padding: 16, backgroundColor: "#111" },
  scannerHint: { color: "#ddd", marginBottom: 12 },
  doneBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontWeight: "800" },
});
