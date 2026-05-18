import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ServiceOrderScreen from "./screens/ServiceOrderScreen";
import CreateServiceOrderScreen from "./screens/CreateServiceOrderScreen";
import FinancialScreen from './screens/FinancialScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ServiceOrder" component={ServiceOrderScreen} />
        <Stack.Screen
          name="CreateServiceOrder"
          component={CreateServiceOrderScreen}
        />
        <Stack.Screen name="Financije" component={FinancialScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
