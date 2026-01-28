import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import CompanySelectionScreen from "../screens/CompanySelectionScreen";
import StoreSelectionScreen from "../screens/StoreSelectionScreen";
import ActionsScreen from "../screens/ActionsScreen";
// Action screens
import StockTakingScreen from "../screens/StockTakingScreen";
import StockTransferScreen from "../screens/StockTransferScreen";
import StockRequestScreen from "../screens/StockRequestScreen";
import SellItemScreen from "../screens/SellItemScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="CompanySelection"
        component={CompanySelectionScreen}
      />
      <Stack.Screen name="StoreSelection" component={StoreSelectionScreen} />
      <Stack.Screen name="Actions" component={ActionsScreen} />
      {/* Add action screens */}
      <Stack.Screen name="StockTaking" component={StockTakingScreen} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} />
      <Stack.Screen name="StockRequest" component={StockRequestScreen} />
      <Stack.Screen name="SellItem" component={SellItemScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
