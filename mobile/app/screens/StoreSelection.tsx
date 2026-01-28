import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { storeApi } from "@/util/api";

interface Store {
  id: number;
  name: string;
  type: string;
}

const StoreSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await storeApi.getAll();
      setStores(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load stores");
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    // Pass store to next screen
    navigation.navigate("StockTaking", {
      storeId: store.id,
      storeName: store.name,
    });
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={[
        styles.storeCard,
        selectedStore?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSelectStore(item)}
    >
      <View style={styles.storeIcon}>
        <Text style={styles.storeIconText}>
          {item.type === "warehouse" ? "📦" : "🏪"}
        </Text>
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeType}>
          {item.type === "warehouse" ? "Warehouse" : "Shop"}
        </Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Loading stores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Store</Text>
        <Text style={styles.headerSubtitle}>
          Choose where to perform stock taking
        </Text>
      </View>

      {/* Stores List */}
      {stores.length > 0 ? (
        <FlatList
          data={stores}
          renderItem={renderStoreItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No stores available</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e0e7ff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#1e40af",
  },
  storeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  storeIconText: {
    fontSize: 28,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  storeType: {
    fontSize: 12,
    color: "#6b7280",
  },
  arrow: {
    fontSize: 18,
    color: "#9ca3af",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
});

export default StoreSelectionScreen;
