import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

const actions: ActionItem[] = [
  {
    id: "stock_taking",
    title: "Stock Taking",
    description: "Count and verify inventory levels",
    icon: "clipboard-outline",
    color: "#4CAF50",
    screen: "StockTaking",
  },
  {
    id: "stock_transfer",
    title: "Stock Transfer",
    description: "Transfer stock between locations",
    icon: "swap-horizontal-outline",
    color: "#2196F3",
    screen: "StockTransfer",
  },
  {
    id: "stock_request",
    title: "Stock Request",
    description: "Request stock from warehouse",
    icon: "cart-outline",
    color: "#FF9800",
    screen: "StockRequest",
  },
  {
    id: "sell_item",
    title: "Sell Item",
    description: "Sell items to customers",
    icon: "pricetag-outline",
    color: "#FF5722",
    screen: "SellItem",
  },
];

const ActionsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, storeName, companyId } = route.params || {};

  const handleActionPress = (action: ActionItem) => {
    navigation.navigate(action.screen, {
      storeId,
      storeName,
      companyId,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Actions</Text>
          {storeName && <Text style={styles.subtitle}>{storeName}</Text>}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleActionPress(action)}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: action.color }]}
            >
              <Ionicons name={action.icon} size={32} color="#ffffff" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

export default ActionsScreen;
