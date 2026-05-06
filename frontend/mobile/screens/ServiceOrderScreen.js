import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getServiceOrders, updateServiceOrderStatus } from "../services/api";
import styles from "./styles/serviceOrderScreen";

const FILTER_TYPES = [
  { label: "Svi tipovi", value: "all" },
  { label: "Instalacija", value: "installation" },
  { label: "Popravak", value: "repair" },
  { label: "Održavanje", value: "maintenance" },
];

const SORT_OPTIONS = [
  { label: "Najnovije", value: "newest" },
  { label: "Najstarije", value: "oldest" },
];

const getTypeText = (type) => {
  switch (type) {
    case "installation":
    case "Instalacija":
      return "Instalacija";
    case "repair":
    case "Popravak":
      return "Popravak";
    case "maintenance":
    case "Održavanje":
      return "Održavanje";
    default:
      return type || "Nepoznato";
  }
};

const normalizeOrderType = (order) => {
  const rawType = order.type || order.serviceType || "";
  const normalized = rawType.toString().trim().toLowerCase();
  if (normalized.includes("install") || normalized.includes("instal"))
    return "installation";
  if (normalized.includes("poprav")) return "repair";
  if (
    normalized.includes("održ") ||
    normalized.includes("odrz") ||
    normalized.includes("odrzav")
  )
    return "maintenance";
  if (
    normalized === "installation" ||
    normalized === "repair" ||
    normalized === "maintenance"
  )
    return normalized;
  return normalized;
};

const ServiceOrderItem = ({ item, onPress }) => {
  const statusText =
    item.status === 1 || item.status === "1" ? "Zatvoren" : "Otvoren";
  const statusColor =
    item.status === 1 || item.status === "1" ? "#28a745" : "#ffc107";
  const orderType = getTypeText(normalizeOrderType(item));
  const locationText = item.location || item.description || "Nepoznato";
  const orderDate = item.createdAt || item.date || item.updatedAt || "";

  return (
    <TouchableOpacity style={styles.orderItem} onPress={onPress}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.serviceOrderID || item.id}</Text>
        <Text
          style={[
            styles.orderStatus,
            {
              backgroundColor: statusColor + "20",
              color: statusColor,
            },
          ]}
        >
          {statusText}
        </Text>
      </View>
      <Text style={styles.orderType}>{orderType}</Text>
      <Text style={styles.orderLocation}>{locationText}</Text>
      <Text style={styles.orderDate}>
        {new Date(orderDate).toLocaleDateString()}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

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

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...serviceOrders]
      .filter((item) => {
        const itemType = normalizeOrderType(item);
        const orderTypeLabel = getTypeText(itemType).toLowerCase();
        const location = (item.location || item.description || "")
          .toString()
          .toLowerCase();
        const name = (item.name || item.customerName || "")
          .toString()
          .toLowerCase();
        const searchSource = `${orderTypeLabel} ${location} ${name}`.trim();

        const matchesSearch =
          !normalizedQuery || searchSource.includes(normalizedQuery);
        const matchesType = selectedType === "all" || itemType === selectedType;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const aDate = new Date(
          a.createdAt || a.date || a.updatedAt || 0,
        ).getTime();
        const bDate = new Date(
          b.createdAt || b.date || b.updatedAt || 0,
        ).getTime();
        return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
      });
  }, [serviceOrders, searchQuery, selectedType, sortOrder]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />

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

      <View style={styles.filterContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Pretraži ime, lokaciju ili tip"
          placeholderTextColor="#5c6f78"
          style={styles.searchInput}
        />

        <ScrollView
          style={styles.filterScroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_TYPES.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setSelectedType(filter.value)}
              style={[
                styles.filterChip,
                selectedType === filter.value && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}

          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSortOrder(option.value)}
              style={[
                styles.filterChip,
                sortOrder === option.value && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortOrder === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nema odgovarajućih naloga</Text>
            <Text style={styles.emptySubtext}>
              Pokušajte promijeniti pretragu ili filter.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
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

      <TouchableOpacity style={styles.addButton} onPress={handleCreateOrder}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
