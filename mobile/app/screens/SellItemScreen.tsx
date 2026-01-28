import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useMemo, useState } from "react";
import {
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

type RouteParams = {
  storeId?: number;
  storeName?: string;
  companyId?: number;
};

type StorageOption = "32GB" | "64GB" | "128GB" | "256GB";

const STORAGE_OPTIONS: StorageOption[] = ["32GB", "64GB", "128GB", "256GB"];

export default function SellItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName } = (route.params ?? {}) as RouteParams;

  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);

  const [imeiCode, setImeiCode] = useState<string>("");
  const [storage, setStorage] = useState<StorageOption | "">("");
  const [amount, setAmount] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const canSubmit = useMemo(() => {
    return (
      Boolean(storeId) &&
      Boolean(imeiCode.trim()) &&
      Boolean(amount.trim()) &&
      !Number.isNaN(Number(amount)) &&
      Boolean(customerName.trim()) &&
      Boolean(customerPhone.trim()) &&
      Boolean(notes.trim())
    );
  }, [storeId, imeiCode, amount, customerName, customerPhone, notes]);

  const handleBack = () => navigation.goBack();

  const handleSubmit = async () => {
    if (!storeId) {
      Alert.alert("Missing store", "Please select a store first.");
      return;
    }
    if (!imeiCode.trim()) {
      Alert.alert("Missing IMEI", "Please scan the IMEI code.");
      return;
    }
    if (!amount.trim() || Number.isNaN(Number(amount))) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !notes.trim()) {
      Alert.alert(
        "Missing customer info",
        "Please enter customer name, phone and notes.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      // Design-only: backend wiring can be added once transaction type is confirmed.
      Alert.alert(
        "Sale prepared",
        `IMEI: ${imeiCode}\nAmount: ${amount}${storage ? `\nStorage: ${storage}` : ""}\nCustomer: ${customerName} (${customerPhone})\nNotes: ${notes}`,
      );
      setImeiCode("");
      setStorage("");
      setAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setImeiCode(data);
    setTimeout(() => setScanned(false), 700);
    setShowScanner(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sell Item</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan IMEI</Text>

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
            placeholder="Scanned IMEI will appear here"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            style={styles.input}
          />

          <Text style={styles.label}>Storage (optional)</Text>
          <View style={styles.pillsRow}>
            {STORAGE_OPTIONS.map((opt) => {
              const active = storage === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setStorage(active ? "" : opt)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor="#999"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Customer phone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes"
            placeholderTextColor="#999"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          <Ionicons name="pricetag-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Processing..." : "Complete Sale"}
          </Text>
        </TouchableOpacity>

        {!storeId ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              No store selected. Go back and select a store.
            </Text>
          </View>
        ) : null}
      </ScrollView>

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
  multiline: { minHeight: 90, textAlignVertical: "top" },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  pillActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  pillText: { color: "#1f2937", fontWeight: "600" },
  pillTextActive: { color: "#fff" },
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
  primaryButtonDisabled: { opacity: 0.6 },
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
  scannerFooter: { padding: 16, backgroundColor: "#111" },
  scannerHint: { color: "#ddd", marginBottom: 12 },
  doneBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontWeight: "800" },
});
