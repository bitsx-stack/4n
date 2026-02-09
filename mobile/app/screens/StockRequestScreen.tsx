import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";

import SelectionModal, { NamedItem } from "./SelectionModal";
import {
  categoryApi,
  categoryTypeApi,
  storesApi,
  imeiApi,
  stockRequestApi,
} from "@/util/api";
import LogoutButton from "@/components/LogoutButton";

type RouteParams = {
  storeId?: number;
  storeName?: string;
  companyId?: number;
};

type StorageOption = "32GB" | "64GB" | "128GB" | "256GB";
const STORAGE_OPTIONS: StorageOption[] = ["32GB", "64GB", "128GB", "256GB"];

type StoreItem = NamedItem & { type?: string };
type BrandItem = NamedItem & { categorytype_id?: number };
type ModelItem = NamedItem & { categorytype_id: number };

type ImeiItem = {
  id: number;
  code: string;
  brand: string;
  model: string;
  storage_size: string;
  store_id: number;
};

type StockRequestOrder = {
  id: string;
  sourceStore: StoreItem;
  destinationStore: StoreItem;
  brand: BrandItem;
  model: ModelItem;
  storage: string;
  requestedQuantity: number;
  availableStock: number;
  movedQuantity: number;
  status: "pending" | "transferred" | "completed" | "cancelled" | "rejected";
  notes: string;
  requestedImeis: string[];
  transferredImeis: string[];
  receivedImeis: string[];
  createdAt: Date;
  updatedAt: Date;
};

export default function StockRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName, companyId } = (route.params ?? {}) as RouteParams;

  // Debug: log route params
  console.log("StockRequestScreen route params:", {
    storeId,
    storeName,
    companyId,
  });

  // Warehouse stores (source)
  const [warehouseStores, setWarehouseStores] = useState<StoreItem[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);

  // Brands and Models from categories
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  // Source store selection (warehouse type)
  const [showSourceStoreModal, setShowSourceStoreModal] =
    useState<boolean>(false);
  const [sourceStoreSearch, setSourceStoreSearch] = useState<string>("");
  const [selectedSourceStore, setSelectedSourceStore] =
    useState<StoreItem | null>(null);

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

  // Stock info
  const [sourceImeis, setSourceImeis] = useState<ImeiItem[]>([]);
  const [destImeis, setDestImeis] = useState<ImeiItem[]>([]);
  const [loadingStock, setLoadingStock] = useState<boolean>(false);

  // Orders
  const [orders, setOrders] = useState<StockRequestOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [showOrdersList, setShowOrdersList] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<StockRequestOrder | null>(
    null,
  );
  const [showOrderDetail, setShowOrderDetail] = useState<boolean>(false);

  // Filters
  const [filterSourceStore, setFilterSourceStore] = useState<StoreItem | null>(
    null,
  );

  // Receive modal
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [receiveQuantity, setReceiveQuantity] = useState<string>("");
  const [scannedImeis, setScannedImeis] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [manualImei, setManualImei] = useState<string>("");
  const [permission, requestPermission] = useCameraPermissions();

  // Load warehouse stores for the selected company
  const loadWarehouseStores = useCallback(async () => {
    if (!companyId) {
      console.log("No companyId provided");
      return;
    }
    setLoadingStores(true);
    try {
      console.log("Loading stores for company:", companyId);
      const res = await storesApi.getStoresByCompany(companyId);
      console.log("Stores response:", res.data);
      const allStores: any[] = res.data ?? [];
      // Show all stores as source options (filter out current destination store)
      const sourceStores = allStores
        .map((s: any) => ({
          id: Number(s.id),
          name: String(s.name),
          type: s.type,
        }))
        .filter((s) => Number.isFinite(s.id) && s.name && s.id !== storeId);
      console.log("Source stores:", sourceStores);
      setWarehouseStores(sourceStores);
    } catch (e: any) {
      console.error("Failed to load stores:", e);
      Alert.alert("Error", e?.message ?? "Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  }, [companyId, storeId]);

  // Load brands (categories where category type name is "BRAND")
  const loadBrands = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      console.log("Loading brands (categories of type BRAND)...");
      const brandList = await categoryApi.listByTypeName("BRAND");
      console.log("Brands loaded:", brandList);
      setBrands(
        (brandList ?? [])
          .map((b: any) => ({
            id: Number(b.id),
            name: String(b.name),
            categorytype_id: b.categorytype_id,
          }))
          .filter((b) => Number.isFinite(b.id) && b.name),
      );
    } catch (e: any) {
      console.error("Failed to load brands:", e);
      Alert.alert("Error", "Failed to load brands");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  // Load models (categories where categorytype_id = category type ID matching selected brand name)
  const loadModels = useCallback(async () => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }
    try {
      console.log("Loading models for brand:", selectedBrand.name);

      // First, get category type by name matching the selected brand
      const categoryTypes = await categoryTypeApi.listAll();
      const matchingCategoryType = categoryTypes.find(
        (ct: any) =>
          ct.name?.toLowerCase() === selectedBrand.name.toLowerCase(),
      );

      if (!matchingCategoryType) {
        console.log("No category type found for brand:", selectedBrand.name);
        setModels([]);
        return;
      }

      console.log(
        "Found category type:",
        matchingCategoryType.id,
        matchingCategoryType.name,
      );

      // Get categories where categorytype_id = found category type's ID
      const modelList = await categoryApi.listByType(matchingCategoryType.id);
      console.log("Models loaded:", modelList);
      setModels(
        (modelList ?? [])
          .map((m: any) => ({
            id: Number(m.id),
            name: String(m.name),
            categorytype_id: Number(m.categorytype_id),
          }))
          .filter((m) => Number.isFinite(m.id) && m.name),
      );
    } catch (e) {
      console.error("Failed to load models:", e);
      setModels([]);
    }
  }, [selectedBrand]);

  // Load stock (IMEIs) for source and destination stores - called when source store is selected
  const loadStock = useCallback(async () => {
    if (!selectedSourceStore || !storeId) {
      console.log("loadStock skipped - missing source store or storeId", {
        hasSourceStore: !!selectedSourceStore,
        hasStoreId: !!storeId,
      });
      return;
    }
    setLoadingStock(true);
    try {
      console.log(
        "Loading stock for source:",
        selectedSourceStore.id,
        "and dest:",
        storeId,
      );
      const [sourceRes, destRes] = await Promise.all([
        imeiApi.getByStoreId(selectedSourceStore.id),
        imeiApi.getByStoreId(storeId),
      ]);
      console.log(
        "Raw source response:",
        JSON.stringify(sourceRes?.data).slice(0, 500),
      );
      const sourceData = sourceRes?.data?.data ?? sourceRes?.data ?? [];
      const destData = destRes?.data?.data ?? destRes?.data ?? [];
      console.log("Source IMEIs loaded:", sourceData.length);
      console.log("Dest IMEIs loaded:", destData.length);
      if (sourceData.length > 0) {
        console.log("Sample source IMEI:", JSON.stringify(sourceData[0]));
      }
      setSourceImeis(Array.isArray(sourceData) ? sourceData : []);
      setDestImeis(Array.isArray(destData) ? destData : []);
    } catch (e) {
      console.error("Failed to load stock:", e);
    } finally {
      setLoadingStock(false);
    }
  }, [selectedSourceStore, storeId]);

  // Load stock requests from backend
  const loadOrders = useCallback(async () => {
    if (!storeId) return;
    setLoadingOrders(true);
    try {
      const res = await stockRequestApi.getByStore(storeId);
      const items = res.data?.data ?? res.data ?? [];
      const mapped: StockRequestOrder[] = items.map((sr: any) => ({
        id: String(sr.id),
        sourceStore: { id: sr.source_store_id, name: sr.source_store_name },
        destinationStore: {
          id: sr.destination_store_id,
          name: sr.destination_store_name,
        },
        brand: { id: 0, name: sr.brand },
        model: { id: 0, name: sr.model },
        storage: sr.storage,
        requestedQuantity: sr.requested_quantity,
        availableStock: sr.available_stock,
        movedQuantity: sr.moved_quantity,
        status: sr.status,
        notes: sr.notes || "",
        requestedImeis: sr.requested_imeis || [],
        transferredImeis: sr.transferred_imeis || [],
        receivedImeis: sr.received_imeis || [],
        createdAt: new Date(sr.created_at),
        updatedAt: new Date(sr.updated_at),
      }));
      setOrders(mapped);
    } catch (e) {
      console.error("Failed to load stock requests:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, [storeId]);

  // Load brands on mount
  useEffect(() => {
    loadWarehouseStores();
    loadBrands();
    loadOrders();
  }, [loadWarehouseStores, loadBrands, loadOrders]);

  // Load models when brand changes
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Load stock when source store is selected
  useEffect(() => {
    if (selectedSourceStore) {
      loadStock();
    }
  }, [selectedSourceStore, loadStock]);

  useEffect(() => {
    setSelectedModel(null);
    setModelSearch("");
  }, [selectedBrand?.id]);

  // Filtered stock counts
  // Helper to normalize storage value (removes spaces, uppercase like "128GB")
  const normalizeStorageValue = (val: string | null | undefined): string => {
    if (!val || typeof val !== "string") return "";
    const cleaned = val.trim();
    if (!cleaned) return "";
    return cleaned.replace(/\s+/g, "").toUpperCase();
  };

  // Extract storage from IMEI - check storage_size field or parse from model name
  const normalizeStorageFromImei = (imei: ImeiItem): string => {
    // First try storage_size field
    const fromField = normalizeStorageValue(imei.storage_size);
    if (fromField) return fromField;

    // Fallback: try to extract storage from model name (e.g., "iPhone 13 128GB")
    const modelMatch = String(imei.model || "").match(
      /\b(32|64|128|256|512)\s*(GB|TB)\b/i,
    );
    if (modelMatch) {
      return `${modelMatch[1]}${modelMatch[2]}`.toUpperCase();
    }
    return "";
  };

  // Progressive source stock: filters applied as selections are made
  const progressiveSourceStock = useMemo(() => {
    let filtered = sourceImeis;
    if (selectedBrand) {
      filtered = filtered.filter(
        (i) => i.brand?.toLowerCase() === selectedBrand.name.toLowerCase(),
      );
    }
    if (selectedModel) {
      filtered = filtered.filter(
        (i) => i.model?.toLowerCase() === selectedModel.name.toLowerCase(),
      );
    }
    if (storage) {
      const wantedStorage = normalizeStorageValue(storage);
      filtered = filtered.filter(
        (i) => normalizeStorageFromImei(i) === wantedStorage,
      );
    }
    return filtered;
  }, [sourceImeis, selectedBrand, selectedModel, storage]);

  // Progressive dest stock: same progressive filtering for destination
  const progressiveDestStock = useMemo(() => {
    let filtered = destImeis;
    if (selectedBrand) {
      filtered = filtered.filter(
        (i) => i.brand?.toLowerCase() === selectedBrand.name.toLowerCase(),
      );
    }
    if (selectedModel) {
      filtered = filtered.filter(
        (i) => i.model?.toLowerCase() === selectedModel.name.toLowerCase(),
      );
    }
    if (storage) {
      const wantedStorage = normalizeStorageValue(storage);
      filtered = filtered.filter(
        (i) => normalizeStorageFromImei(i) === wantedStorage,
      );
    }
    return filtered;
  }, [destImeis, selectedBrand, selectedModel, storage]);

  // Group progressive source stock by brand → model for summary
  const sourceStockSummary = useMemo(() => {
    const grouped = new Map<
      string,
      { brand: string; model: string; quantity: number }
    >();
    progressiveSourceStock.forEach((imei) => {
      const key = `${imei.brand}_${imei.model}`;
      if (!grouped.has(key)) {
        grouped.set(key, { brand: imei.brand, model: imei.model, quantity: 0 });
      }
      grouped.get(key)!.quantity += 1;
    });
    return Array.from(grouped.values()).sort((a, b) => b.quantity - a.quantity);
  }, [progressiveSourceStock]);

  const filteredSourceStock = useMemo(() => {
    if (!selectedBrand || !selectedModel || !storage) {
      console.log("Filtering skipped - missing:", {
        hasBrand: !!selectedBrand,
        hasModel: !!selectedModel,
        hasStorage: !!storage,
      });
      return [];
    }
    const wantedStorage = normalizeStorageValue(storage);
    console.log("Filtering source stock:", {
      brand: selectedBrand.name,
      model: selectedModel.name,
      storage,
      wantedStorage,
      totalImeis: sourceImeis.length,
      sampleImei: sourceImeis[0]
        ? {
            brand: sourceImeis[0].brand,
            model: sourceImeis[0].model,
            storage_size: sourceImeis[0].storage_size,
            normalized: normalizeStorageFromImei(sourceImeis[0]),
          }
        : null,
    });
    const filtered = sourceImeis.filter((i) => {
      const brandMatch =
        i.brand?.toLowerCase() === selectedBrand.name.toLowerCase();
      const modelMatch =
        i.model?.toLowerCase() === selectedModel.name.toLowerCase();
      const imeiStorage = normalizeStorageFromImei(i);
      const storageMatch = imeiStorage === wantedStorage;
      return brandMatch && modelMatch && storageMatch;
    });
    console.log("Filtered source stock count:", filtered.length);
    return filtered;
  }, [sourceImeis, selectedBrand, selectedModel, storage]);

  const filteredDestStock = useMemo(() => {
    if (!selectedBrand || !selectedModel || !storage) return [];
    const wantedStorage = normalizeStorageValue(storage);
    return destImeis.filter((i) => {
      const brandMatch =
        i.brand?.toLowerCase() === selectedBrand.name.toLowerCase();
      const modelMatch =
        i.model?.toLowerCase() === selectedModel.name.toLowerCase();
      const imeiStorage = normalizeStorageFromImei(i);
      const storageMatch = imeiStorage === wantedStorage;
      return brandMatch && modelMatch && storageMatch;
    });
  }, [destImeis, selectedBrand, selectedModel, storage]);

  const canSubmit = useMemo(() => {
    const qty = Number(quantity);
    return (
      Boolean(storeId) &&
      Boolean(selectedSourceStore?.id) &&
      Boolean(selectedBrand?.id) &&
      Boolean(selectedModel?.id) &&
      Boolean(storage) &&
      Number.isFinite(qty) &&
      qty > 0 &&
      qty <= filteredSourceStock.length
    );
  }, [
    storeId,
    selectedSourceStore?.id,
    selectedBrand?.id,
    selectedModel?.id,
    storage,
    quantity,
    filteredSourceStock.length,
  ]);

  const filteredSourceStores = useMemo(() => {
    const q = sourceStoreSearch.trim().toLowerCase();
    if (!q) return warehouseStores;
    return warehouseStores.filter((s) => s.name.toLowerCase().includes(q));
  }, [sourceStoreSearch, warehouseStores]);

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandSearch, brands]);

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.name.toLowerCase().includes(q));
  }, [modelSearch, models]);

  // Filtered orders (by source store filter + last 30 days)
  const filteredOrders = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orders.filter((o) => {
      const matchesSource =
        !filterSourceStore || o.sourceStore.id === filterSourceStore.id;
      const matchesDest =
        o.destinationStore.id === storeId || o.sourceStore.id === storeId;
      const withinDate = o.createdAt >= thirtyDaysAgo;
      return matchesSource && matchesDest && withinDate;
    });
  }, [orders, filterSourceStore, storeId]);

  const handleBack = () => navigation.goBack();

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Missing info",
        "Please select source store, brand, model, storage and valid quantity.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await stockRequestApi.create({
        source_store_id: selectedSourceStore!.id,
        source_store_name: selectedSourceStore!.name,
        destination_store_id: storeId!,
        destination_store_name: storeName!,
        brand: selectedBrand!.name,
        model: selectedModel!.name,
        storage: storage,
        requested_quantity: Number(quantity),
        available_stock: filteredSourceStock.length,
        notes: notes,
        requested_imeis: filteredSourceStock
          .slice(0, Number(quantity))
          .map((i) => i.code),
      });

      // Reload orders from backend
      await loadOrders();

      Alert.alert(
        "Request Created",
        `From: ${selectedSourceStore?.name}\nTo: ${storeName}\n${selectedBrand?.name} ${selectedModel?.name} ${storage}\nQty: ${quantity}`,
      );

      // Reset form
      setSelectedBrand(null);
      setSelectedModel(null);
      setStorage("");
      setQuantity("1");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order actions
  const handleReceive = (order: StockRequestOrder) => {
    setSelectedOrder(order);
    setReceiveQuantity(order.requestedQuantity.toString());
    setScannedImeis([]);
    setShowReceiveModal(true);
  };

  const handleCancel = (order: StockRequestOrder) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: async () => {
            try {
              await stockRequestApi.cancel(Number(order.id));
              await loadOrders();
            } catch (e: any) {
              const msg =
                e?.response?.data?.detail ?? e?.message ?? "Failed to cancel";
              Alert.alert("Error", msg);
            }
          },
        },
      ],
    );
  };

  const handleScanBarcode = (data: string) => {
    if (!selectedOrder) return;

    const code = data.trim();
    if (!code) return;

    // Check if IMEI is in the transferred list (only scan what was actually sent)
    if (!selectedOrder.transferredImeis.includes(code)) {
      Alert.alert(
        "Invalid IMEI",
        "This IMEI was not in the transfer. Only scan IMEIs that were transferred.",
      );
      return;
    }

    // Check if already scanned
    if (scannedImeis.includes(code)) {
      Alert.alert("Already Scanned", "This IMEI has already been scanned.");
      return;
    }

    setScannedImeis((prev) => [...prev, code]);
    setShowScanner(false);
  };

  const handleAddManualImei = () => {
    if (!manualImei.trim()) return;
    handleScanBarcode(manualImei.trim());
    setManualImei("");
  };

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return;

    try {
      await stockRequestApi.executeReceive(Number(selectedOrder.id), {
        received_imeis: scannedImeis,
      });
      await loadOrders();
      // Also refresh stock counts if source store is selected
      if (selectedSourceStore) await loadStock();

      setShowReceiveModal(false);
      setSelectedOrder(null);
      setScannedImeis([]);

      Alert.alert(
        "Received!",
        `${scannedImeis.length} item(s) received and moved to your store. Stock updated.`,
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ?? e?.message ?? "Failed to receive";
      Alert.alert("Error", msg);
    }
  };

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusColor = (status: StockRequestOrder["status"]) => {
    switch (status) {
      case "pending":
        return "#fff3cd";
      case "transferred":
        return "#cce5ff";
      case "completed":
        return "#d4edda";
      case "cancelled":
        return "#e0e0e0";
      case "rejected":
        return "#f8d7da";
      default:
        return "#e0e0e0";
    }
  };

  const renderOrderItem = ({ item }: { item: StockRequestOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderDetail(true);
      }}
    >
      <View style={styles.orderCardHeader}>
        <Text style={styles.orderCardTitle}>
          {item.brand.name} {item.model.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderCardSubtitle}>{item.storage}</Text>
      <View style={styles.orderCardRow}>
        <Text style={styles.orderCardLabel}>From:</Text>
        <Text style={styles.orderCardValue}>{item.sourceStore.name}</Text>
      </View>
      <View style={styles.orderCardRow}>
        <Text style={styles.orderCardLabel}>To:</Text>
        <Text style={styles.orderCardValue}>{item.destinationStore.name}</Text>
      </View>
      <View style={styles.orderCardRow}>
        <Text style={styles.orderCardLabel}>Qty:</Text>
        <Text style={styles.orderCardValue}>
          {item.movedQuantity}/{item.requestedQuantity} (Available:{" "}
          {item.availableStock})
        </Text>
      </View>
      <Text style={styles.orderCardTime}>
        Created: {formatDate(item.createdAt)}
      </Text>
      {item.updatedAt.getTime() !== item.createdAt.getTime() && (
        <Text style={styles.orderCardTime}>
          Updated: {formatDate(item.updatedAt)}
        </Text>
      )}

      {/* Cancel button for pending requests */}
      {item.status === "pending" && item.destinationStore.id === storeId && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleCancel(item)}
          >
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receive button for transferred requests */}
      {item.status === "transferred" &&
        item.destinationStore.id === storeId && (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.receiveBtn]}
              onPress={() => handleReceive(item)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>
                Receive ({item.movedQuantity} items)
              </Text>
            </TouchableOpacity>
          </View>
        )}
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Stock Request</Text>
          <Text style={styles.subtitle}>{storeName ?? "Store"}</Text>
        </View>
        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => {
            loadOrders();
            setShowOrdersList(true);
          }}
        >
          <Ionicons name="document-text-outline" size={26} color="#fff" />
          {orders.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {
                  orders.filter(
                    (o) => o.status === "pending" || o.status === "transferred",
                  ).length
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <LogoutButton />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Request Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Request</Text>

          <Text style={styles.label}>Source Store (Warehouse)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSourceStoreModal(true)}
            disabled={loadingStores}
          >
            <Text style={styles.selectButtonText}>
              {selectedSourceStore?.name ??
                (loadingStores ? "Loading..." : "Select warehouse")}
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

          <Text style={styles.label}>Storage</Text>
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
            placeholder="Add notes for this request"
            placeholderTextColor="#999"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        {/* Destination Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destination Store</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Store</Text>
            <Text style={styles.kvValue}>{storeName ?? "(not selected)"}</Text>
          </View>
        </View>

        {/* Stock Availability - Show as soon as source store is selected */}
        {selectedSourceStore && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stock Availability</Text>
            {loadingStock ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                {/* Filter hint */}
                {(!selectedBrand || !selectedModel || !storage) && (
                  <Text style={styles.filterHint}>
                    {!selectedBrand
                      ? "Showing all stock • Select brand to filter"
                      : !selectedModel
                        ? `Filtered by ${selectedBrand.name} • Select model to refine`
                        : `Filtered by ${selectedBrand.name} ${selectedModel.name} • Select storage to refine`}
                  </Text>
                )}

                {/* Quantity summary row */}
                <View style={styles.stockRow}>
                  <View style={styles.stockItem}>
                    <Text style={styles.stockLabel}>Source</Text>
                    <Text
                      style={[
                        styles.stockValue,
                        progressiveSourceStock.length === 0 &&
                          styles.stockValueZero,
                      ]}
                    >
                      {progressiveSourceStock.length}
                    </Text>
                    <Text style={styles.stockStore}>
                      {selectedSourceStore.name}
                    </Text>
                  </View>
                  <View style={styles.stockDivider} />
                  <View style={styles.stockItem}>
                    <Text style={styles.stockLabel}>Destination</Text>
                    <Text style={styles.stockValue}>
                      {progressiveDestStock.length}
                    </Text>
                    <Text style={styles.stockStore}>{storeName}</Text>
                  </View>
                </View>

                {/* Unique items & brands summary */}
                {sourceStockSummary.length > 0 && (
                  <View style={styles.stockSummaryRow}>
                    <View style={styles.summaryBadge}>
                      <Ionicons
                        name="layers-outline"
                        size={14}
                        color="#007AFF"
                      />
                      <Text style={styles.summaryBadgeText}>
                        {sourceStockSummary.length} item
                        {sourceStockSummary.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.summaryBadge}>
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color="#FF9800"
                      />
                      <Text style={styles.summaryBadgeText}>
                        {
                          new Set(progressiveSourceStock.map((i) => i.brand))
                            .size
                        }{" "}
                        brand
                        {new Set(progressiveSourceStock.map((i) => i.brand))
                          .size !== 1
                          ? "s"
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.summaryBadge}>
                      <Ionicons name="cube-outline" size={14} color="#4CAF50" />
                      <Text style={styles.summaryBadgeText}>
                        {progressiveSourceStock.length} total
                      </Text>
                    </View>
                  </View>
                )}

                {/* Stock breakdown table (when no full filter yet) */}
                {sourceStockSummary.length > 0 &&
                  !(selectedBrand && selectedModel && storage) && (
                    <View style={styles.stockBreakdown}>
                      <Text style={styles.imeiListTitle}>Stock Breakdown</Text>
                      {sourceStockSummary.slice(0, 6).map((item, idx) => (
                        <View key={idx} style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel} numberOfLines={1}>
                            {item.brand} {item.model}
                          </Text>
                          <View style={styles.breakdownQtyBadge}>
                            <Text style={styles.breakdownQty}>
                              {item.quantity}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {sourceStockSummary.length > 6 && (
                        <Text style={styles.moreText}>
                          +{sourceStockSummary.length - 6} more items...
                        </Text>
                      )}
                    </View>
                  )}

                {/* Detailed IMEIs (when all filters are applied) */}
                {selectedBrand &&
                  selectedModel &&
                  storage &&
                  filteredSourceStock.length > 0 && (
                    <View style={styles.imeiList}>
                      <Text style={styles.imeiListTitle}>
                        Available IMEIs from source:
                      </Text>
                      {filteredSourceStock.slice(0, 5).map((imei) => (
                        <Text key={imei.id} style={styles.imeiCode}>
                          • {imei.code}
                        </Text>
                      ))}
                      {filteredSourceStock.length > 5 && (
                        <Text style={styles.moreText}>
                          +{filteredSourceStock.length - 5} more...
                        </Text>
                      )}
                    </View>
                  )}

                {/* Empty state */}
                {progressiveSourceStock.length === 0 && (
                  <View style={styles.emptyStockContainer}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color="#999"
                    />
                    <Text style={styles.emptyStockText}>
                      No stock found
                      {selectedBrand ? ` for ${selectedBrand.name}` : ""}
                      {selectedModel ? ` ${selectedModel.name}` : ""}
                      {storage ? ` ${storage}` : ""}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Submit Button */}
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

      {/* Source Store Modal */}
      <SelectionModal<StoreItem>
        visible={showSourceStoreModal}
        title="Source Store (Warehouse)"
        data={filteredSourceStores}
        loading={loadingStores}
        searchValue={sourceStoreSearch}
        onSearchChange={setSourceStoreSearch}
        selectedItem={selectedSourceStore}
        onSelect={(it) => {
          setSelectedSourceStore(it);
          setShowSourceStoreModal(false);
        }}
        onClose={() => setShowSourceStoreModal(false)}
      />

      {/* Brand Modal */}
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

      {/* Model Modal */}
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

      {/* Orders List Modal */}
      <Modal visible={showOrdersList} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stock Requests</Text>
            <TouchableOpacity onPress={() => setShowOrdersList(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>
              Last 30 days • Showing requests for {storeName}
            </Text>
          </View>

          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.ordersList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No requests found</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Receive Modal */}
      <Modal visible={showReceiveModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receive Items</Text>
            <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView style={styles.receiveContent}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Order Details</Text>
                <Text style={styles.receiveInfo}>
                  {selectedOrder.brand.name} {selectedOrder.model.name}{" "}
                  {selectedOrder.storage}
                </Text>
                <Text style={styles.receiveInfo}>
                  Requested: {selectedOrder.requestedQuantity} items
                </Text>
                <Text style={styles.receiveInfo}>
                  From: {selectedOrder.sourceStore.name}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Scanned IMEIs ({scannedImeis.length}/
                  {selectedOrder.movedQuantity})
                </Text>

                {scannedImeis.map((code, idx) => (
                  <View key={idx} style={styles.scannedItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.scannedCode}>{code}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setScannedImeis((prev) =>
                          prev.filter((c) => c !== code),
                        )
                      }
                    >
                      <Ionicons name="close-circle" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.scanActions}>
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={async () => {
                      if (!permission?.granted) {
                        const result = await requestPermission();
                        if (!result.granted) {
                          Alert.alert(
                            "Permission needed",
                            "Camera permission is required to scan.",
                          );
                          return;
                        }
                      }
                      setShowScanner(true);
                    }}
                  >
                    <Ionicons name="scan" size={20} color="#fff" />
                    <Text style={styles.scanButtonText}>Scan IMEI</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.manualEntry}>
                  <TextInput
                    style={styles.manualInput}
                    value={manualImei}
                    onChangeText={setManualImei}
                    placeholder="Enter IMEI manually"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddManualImei}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Transferred IMEIs (scan these to receive)
                </Text>
                {selectedOrder.transferredImeis.map((code, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.expectedItem,
                      scannedImeis.includes(code) && styles.expectedItemMatched,
                    ]}
                  >
                    <Ionicons
                      name={
                        scannedImeis.includes(code)
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={scannedImeis.includes(code) ? "#4CAF50" : "#999"}
                    />
                    <Text style={styles.expectedCode}>{code}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  scannedImeis.length === 0 && styles.primaryButtonDisabled,
                ]}
                onPress={handleConfirmReceive}
                disabled={scannedImeis.length === 0}
              >
                <Text style={styles.primaryButtonText}>
                  Confirm Receive ({scannedImeis.length}/
                  {selectedOrder.movedQuantity})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan IMEI</Text>
            <View style={{ width: 28 }} />
          </View>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ["code128", "code39", "ean13", "qr"],
            }}
            onBarcodeScanned={(result) => handleScanBarcode(result.data)}
          />
        </View>
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
  ordersButton: { padding: 5, position: "relative" },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
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
  multiline: { minHeight: 80, textAlignVertical: "top" },
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
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stockItem: {
    alignItems: "center",
    flex: 1,
  },
  stockLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
  },
  stockStore: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  stockValueZero: {
    color: "#f44336",
  },
  stockDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  filterHint: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },
  stockSummaryRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  stockBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    marginRight: 8,
  },
  breakdownQtyBadge: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    minWidth: 32,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  breakdownQty: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
  },
  emptyStockContainer: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  emptyStockText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  imeiList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  imeiListTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  imeiCode: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  moreText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  filterLabel: {
    fontSize: 12,
    color: "#666",
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  orderCardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  orderCardRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  orderCardLabel: {
    fontSize: 13,
    color: "#666",
    width: 50,
  },
  orderCardValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  orderCardTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  orderActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  receiveBtn: {
    backgroundColor: "#4CAF50",
  },
  rejectBtn: {
    backgroundColor: "#f44336",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  // Receive modal styles
  receiveContent: {
    flex: 1,
    padding: 16,
  },
  receiveInfo: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  scannedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  scannedCode: {
    flex: 1,
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
  },
  scanActions: {
    marginTop: 12,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  manualEntry: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  manualInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    width: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  expectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  expectedItemMatched: {
    backgroundColor: "#e8f5e9",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  expectedCode: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#333",
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  camera: {
    flex: 1,
  },
});
