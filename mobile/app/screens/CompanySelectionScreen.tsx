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
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL, { companiesApi } from "@/util/api";

interface Company {
  id: number;
  name: string;
  code?: string;
}

const CompanySelectionScreen = () => {
  const navigation = useNavigation<any>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companiesApi.getAll();

      

      setCompanies(response.data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (company: Company) => {
    await AsyncStorage.setItem("selected_company_id", company.id.toString());
    await AsyncStorage.setItem("selected_company_name", company.name);
    navigation.navigate("StoreSelection", { companyId: company.id });
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => handleSelectCompany(item)}
    >
      <View style={styles.companyIcon}>
        <Text style={styles.companyIconText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{item.name}</Text>
        {item.code && <Text style={styles.companyCode}>Code: {item.code}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading companies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Company</Text>
        <Text style={styles.subtitle}>Choose a company to continue</Text>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCompanyItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No companies available</Text>
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
  companyCard: {
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
  companyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  companyInfo: {
    flex: 1,
    marginLeft: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  companyCode: {
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

export default CompanySelectionScreen;
