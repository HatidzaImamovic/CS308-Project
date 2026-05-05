import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getServiceOrders, updateServiceOrderStatus } from "../services/api";
import styles from "./styles/serviceOrderScreen";

const ServiceOrderItem = ({ item, onPress }) => {
  const getStatusText = (status) => {
    if (status === 1 || status === "1") return "Zatvoren";
    return "Otvoren";
  };

  const getStatusColor = (status) => {
    return status === 1 || status === "1" ? "#28a745" : "#ffc107";
  };

  const getTypeText = (type) => {
    switch (type) {
      case "installation":
        return "Instalacija";
      case "repair":
        return "Popravak";
      case "maintenance":
        return "Održavanje";
      default:
        return type || "Nepoznato";
    }
  };

  return (
    <TouchableOpacity style={styles.orderItem} onPress={onPress}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.serviceOrderID || item.id}</Text>
        <Text
          style={[
            styles.orderStatus,
            {
              backgroundColor: getStatusColor(item.status) + "20",
              color: getStatusColor(item.status),
            },
          ]}
        >
          {getStatusText(item.status)}
        </Text>
      </View>
      <Text style={styles.orderType}>{getTypeText(item.type)}</Text>
      <Text style={styles.orderLocation}>{item.description}</Text>
      <Text style={styles.orderDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

export default function ServiceOrderScreen({ route, navigation }) {
  const { user } = route?.params || {};
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadServiceOrders = async () => {
    try {
      const userId = user?.id || user?.userID;
      if (!userId) {
        setError("Korisnik nije pronađen");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const orders = await getServiceOrders(userId);
      setServiceOrders(orders);
      setError(null);
    } catch (error) {
      console.error("Error loading service orders:", error);
      setError("Greška pri učitavanju servisnih naloga");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const userId = user?.id || user?.userID;
      if (userId) {
        loadServiceOrders();
      } else {
        setLoading(false);
      }
    }, [user]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadServiceOrders();
  };

  const handleCreateOrder = () => {
    navigation.navigate("CreateServiceOrder", { user });
  };

  const handleOrderPress = async (order) => {
    const orderId = order.serviceOrderID || order.id;
    const isClosed = order.status === 1 || order.status === "1";
    const newStatus = isClosed ? 0 : 1;
    const statusText = isClosed ? "otvoriti" : "zatvoriti";

    Alert.alert(
      "Promjena statusa",
      `Želite li ${statusText} servisni nalog #${orderId}?`,
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Potvrdi",
          onPress: async () => {
            try {
              await updateServiceOrderStatus(orderId, newStatus);
              loadServiceOrders();
            } catch (error) {
              console.error("Error updating status:", error);
              Alert.alert(
                "Greška",
                "Nije moguće ažurirati status servisnog naloga",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servisni nalozi</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadServiceOrders}
            >
              <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Učitavanje...</Text>
          </View>
        ) : serviceOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nema servisnih naloga</Text>
            <Text style={styles.emptySubtext}>Dodajte novi servisni nalog</Text>
          </View>
        ) : (
          <FlatList
            data={serviceOrders}
            keyExtractor={(item) => String(item.serviceOrderID || item.id)}
            renderItem={({ item }) => (
              <ServiceOrderItem
                item={item}
                onPress={() => handleOrderPress(item)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleCreateOrder}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
