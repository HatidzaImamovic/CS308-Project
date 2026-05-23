import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ServiceOrderScreen from "./screens/ServiceOrderScreen";
import CreateServiceOrderScreen from "./screens/CreateServiceOrderScreen";
import FinancialScreen from './screens/FinancialScreen';
import CatalogueScreen from './screens/shop/CatalogueScreen';
import PartDetailScreen from './screens/shop/PartDetailScreen';
import CartScreen from './screens/shop/CartScreen';
import OrderConfirmScreen from './screens/shop/OrderConfirmScreen';
import OrderHistoryScreen from './screens/shop/OrderHistoryScreen';

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

      <Stack.Screen name="Catalogue" component={CatalogueScreen} />
      <Stack.Screen name="PartDetail" component={PartDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />     

      </Stack.Navigator>
    </NavigationContainer>
  );
}
