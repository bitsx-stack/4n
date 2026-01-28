import { AuthProvider } from "@/context/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import AppNavigator from "@/app/screens/Navigation";

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
