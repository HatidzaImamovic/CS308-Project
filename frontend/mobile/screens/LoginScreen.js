import React, { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import styles from "./styles/loginScreen";
import { login, saveAuthToken, saveUserSession } from "../services/api";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      const data = await login(username, password);
      if (!data || !data.user || !data.token) {
        setError("Pogrešni podaci za prijavu");
        return;
      }

      await saveAuthToken(data.token);
      await saveUserSession(data.user);

      const role = data.user?.role?.toString().toLowerCase();
      const isManager =
        role === "manager" ||
        role === "menadžer" ||
        role === "menadzer" ||
        /^mn/i.test(data.user?.code || data.user?.username || "");
      const isWarehouse =
        role === "warehouse" ||
        role === "skladištar" ||
        role === "skladiÅ¡tar";

      navigation.navigate(
        isManager ? "ManagerHome" : isWarehouse ? "WarehouseHome" : "Home",
        { user: data.user }
      );
    } catch (err) {
      setError(err.message || "Could not connect to server");
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
      <View style={{ width: "100%", flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <TextInput
          style={[styles.input, error && styles.inputError, { flex: 1, marginBottom: 0 }]}
          placeholder="Šifra"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: "absolute", right: 15 }}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="rgba(255,255,255,0.6)"
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Prijavi se</Text>
      </TouchableOpacity>
    </View>
  );
}