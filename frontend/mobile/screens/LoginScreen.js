import React, { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import styles from "./styles/loginScreen";
import config from "../config";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      return () => {
        setUsername("");
        setPassword("");
        setError("");
      };
    }, [])
  );

  const handleLogin = async () => {
    try {
      const response = await fetch(`${config.API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        const role = data.user?.role?.toString().toLowerCase();
        const isManager =
          role === "manager" ||
          role === "menadžer" ||
          role === "menadÅ¾er" ||
          /^mn/i.test(data.user?.code || data.user?.username || "");
        const isWarehouse =
          role === "warehouse" ||
          role === "skladištar" ||
          role === "skladiÅ¡tar";

        navigation.navigate(
          isManager ? "ManagerHome" : isWarehouse ? "WarehouseHome" : "Home",
          { user: data.user }
        );
      } else {
        setError(data.message || "Pogrešni podaci za prijavu");
      }
    } catch (err) {
      setError("Could not connect to server");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../public/centrometalLogo.png")}
        style={styles.logo}
      />
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Ime korisnika"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Šifra"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Prijavi se</Text>
      </TouchableOpacity>
    </View>
  );
}