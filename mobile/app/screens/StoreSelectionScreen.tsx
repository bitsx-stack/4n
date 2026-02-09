import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL, { stockApi, storeApi, storesApi } from "@/util/api";
import LogoutButton from "@/components/LogoutButton";

interface Store {
  id: number;
  name: string;
  location?: string;
}

const StoreSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { companyId } = route.params || {};
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, [companyId]);

  const fetchStores = async () => {
    try {
      const response = await storesApi.getStoresByCompany(companyId);

      setStores(response.data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async (store: Store) => {
    await AsyncStorage.setItem("selected_store_id", store.id.toString());
    await AsyncStorage.setItem("selected_store_name", store.name);
    navigation.navigate("Actions", {
      storeId: store.id,
      storeName: store.name,
      companyId,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleSelectStore(item)}
    >
      <View style={styles.storeIcon}>
        <Ionicons name="storefront-outline" size={28} color="#ffffff" />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        {item.location && (
          <Text style={styles.storeLocation}>{item.location}</Text>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Select Store</Text>
          <Text style={styles.subtitle}>Choose a store to continue</Text>
        </View>
        <LogoutButton />
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStoreItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stores available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.8,
    marginTop: 5,
  },
  listContainer: {
    padding: 16,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  storeLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: "#ccc",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default StoreSelectionScreen;
