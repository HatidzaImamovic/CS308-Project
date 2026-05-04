import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ServiceOrderScreen from './screens/ServiceOrderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Centrometal', headerBackVisible: false }} />
        <Stack.Screen name="ServiceOrders" component={ServiceOrderScreen} options={{ title: 'Servisni nalozi' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
