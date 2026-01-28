import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { categoryApi, categoryTypeApi } from "@/util/api";

type RouteParams = {
  storeId?: number;
  storeName?: string;
  companyId?: number;
};

type StorageOption = "32GB" | "64GB" | "128GB" | "256GB";
const STORAGE_OPTIONS: StorageOption[] = ["32GB", "64GB", "128GB", "256GB"];

type BrandItem = NamedItem;
type ModelItem = NamedItem & { categorytype_id: number };

export default function StockRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName } = (route.params ?? {}) as RouteParams;

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);

  const [showModelModal, setShowModelModal] = useState<boolean>(false);
  const [modelSearch, setModelSearch] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);

  const [storage, setStorage] = useState<StorageOption | "">("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedModel(null);
    setModelSearch("");
  }, [selectedBrand?.id]);

  const canSubmit = useMemo(() => {
    const qty = Number(quantity);
    return (
      Boolean(storeId) &&
      Boolean(selectedBrand?.id) &&
      Boolean(selectedModel?.id) &&
      Boolean(storage) &&
      Number.isFinite(qty) &&
      qty > 0
    );
  }, [storeId, selectedBrand?.id, selectedModel?.id, storage, quantity]);

  const handleBack = () => navigation.goBack();

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Missing info",
        "Please select brand, model, storage and quantity.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      // Design-only: wiring to backend can be added after request endpoint is confirmed.
      Alert.alert(
        "Request created",
        `${selectedBrand?.name} ${selectedModel?.name} ${storage}\nQty: ${quantity}`,
      );
      setSelectedBrand(null);
      setSelectedModel(null);
      setStorage("");
      setQuantity("1");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandSearch, brands]);

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    const byBrand = selectedBrand
      ? models.filter((m) => m.categorytype_id === selectedBrand.id)
      : [];
    if (!q) return byBrand;
    return byBrand.filter((m) => m.name.toLowerCase().includes(q));
  }, [modelSearch, models, selectedBrand]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Stock Request</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request Details</Text>

          <Text style={styles.label}>Brand</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowBrandModal(true)}
            disabled={loadingCatalog}
          >
            <Text style={styles.selectButtonText}>
              {selectedBrand?.name ??
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
              if (!selectedBrand) {
                Alert.alert("Info", "Please select brand first.");
                return;
              }
              setShowModelModal(true);
            }}
            disabled={loadingCatalog || !selectedBrand}
          >
            <Text style={styles.selectButtonText}>
              {selectedModel?.name ??
                (selectedBrand
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

          <Text style={styles.label}>Storage (required)</Text>
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

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            placeholderTextColor="#999"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add instructions for the warehouse"
            placeholderTextColor="#999"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destination</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>To Store</Text>
            <Text style={styles.kvValue}>{storeName ?? "(not selected)"}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Store ID</Text>
            <Text style={styles.kvValue}>{storeId ?? "-"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <SelectionModal<BrandItem>
        visible={showBrandModal}
        title="Brands"
        data={filteredBrands}
        loading={loadingCatalog}
        searchValue={brandSearch}
        onSearchChange={setBrandSearch}
        selectedItem={selectedBrand}
        onSelect={(it) => {
          setSelectedBrand(it);
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
        selectedItem={selectedModel}
        onSelect={(it) => {
          setSelectedModel(it);
          setShowModelModal(false);
        }}
        onClose={() => setShowModelModal(false)}
      />
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
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  pillActive: { backgroundColor: "#FF9800", borderColor: "#FF9800" },
  pillText: { color: "#1f2937", fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kvKey: { color: "#666", fontWeight: "600" },
  kvValue: { color: "#111", fontWeight: "700" },
  selectButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  primaryButton: {
    backgroundColor: "#FF9800",
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
});
