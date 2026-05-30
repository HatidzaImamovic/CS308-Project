import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  fulfillWarehouseOrder,
  getWarehouseOrders,
} from "../services/api";
import styles, { COLORS } from "./styles/warehouseHomeScreen";

const STATUS_FILTERS = [
  { label: "Sve",       value: "all" },
  { label: "Otvorene",  value: "pending" },
  { label: "Ispunjene", value: "completed" },
];

const SORT_FILTERS = [
  { label: "Najnovije", value: "newest" },
  { label: "Najstarije", value: "oldest" },
];

const getTechnicianName = (order) => {
  const { technician = {} } = order;
  const fullName = [technician.fName, technician.lName].filter(Boolean).join(" ");
  return fullName || technician.username || "Nepoznat serviser";
};

const getOrderNumber = (order) =>
  `#ORD-${String(order.orderNumber || order.sparePartsOrderID).padStart(4, "0")}`;

const getItemSummary = (items = [], limit = 2) =>
  items
    .slice(0, limit)
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
};

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </View>
);

const OrderCard = ({ order, onOpen, onFulfill, fulfilling }) => {
  const pending = order.status === "pending";
  const itemSummary = getItemSummary(order.items);
  const hasMore = order.items.length > 2;

  return (
    <TouchableOpacity style={styles.orderCard} onPress={() => onOpen(order)} activeOpacity={0.82}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{getOrderNumber(order)}</Text>
          <Text style={styles.technician}>{getTechnicianName(order)}</Text>
        </View>
        <View style={[styles.statusBadge, pending ? styles.pendingBadge : styles.doneBadge]}>
          <Text style={styles.statusText}>{pending ? "Na čekanju" : "Ispunjeno"}</Text>
        </View>
      </View>

      <Text style={styles.itemSummary}>
        {itemSummary || "Nema artikala"}
        {hasMore ? ` +${order.items.length - 2}` : ""}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(order.submittedAt).toLocaleDateString("bs-BA", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </Text>
        {pending && (
          <TouchableOpacity
            style={[styles.fulfillButton, fulfilling && styles.disabledButton]}
            disabled={fulfilling}
            onPress={(e) => { e?.stopPropagation?.(); onFulfill(order); }}
          >
            <Text style={styles.fulfillButtonText}>
              {fulfilling ? "..." : "Označi ispunjeno"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function WarehouseHome({ route, navigation }) {
  const { user } = route?.params || {};
  const [orders,        setOrders]        = useState([]);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillingId,  setFulfillingId]  = useState(null);
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sortOrder,     setSortOrder]     = useState("newest");

  const loadOrders = useCallback(async () => {
    try {
      const data = await getWarehouseOrders();
      setOrders(data || []);
    } catch (error) {
      Alert.alert("Greška", error.message || "Nije moguće učitati narudžbe.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!query) return true;
        const technician = getTechnicianName(o).toLowerCase();
        const parts = o.items.map((i) => i.name || "").join(" ").toLowerCase();
        const number = getOrderNumber(o).toLowerCase();
        return technician.includes(query) || parts.includes(query) || number.includes(query);
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
        const aTime = new Date(a.submittedAt || 0).getTime();
        const bTime = new Date(b.submittedAt || 0).getTime();
        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [orders, search, sortOrder, statusFilter]);

  const pendingCount   = orders.filter((o) => o.status === "pending").length;
  const fulfilledToday = orders.filter(
    (o) => o.status === "completed" && isToday(o.fulfilledAt)
  ).length;

  const handleRefresh = () => { setRefreshing(true); loadOrders(); };

  const handleFulfill = async (order) => {
    try {
      setFulfillingId(order.sparePartsOrderID);
      await fulfillWarehouseOrder(order.sparePartsOrderID);
      await loadOrders();
      setSelectedOrder((cur) =>
        cur?.sparePartsOrderID === order.sparePartsOrderID
          ? { ...cur, status: "completed", fulfilledAt: new Date().toISOString() }
          : cur
      );
    } catch (error) {
      Alert.alert("Greška", error.message || "Narudžba nije označena.");
    } finally {
      setFulfillingId(null);
    }
  };

  const displayName =
    [user?.fName, user?.lName].filter(Boolean).join(" ") ||
    user?.username ||
    "Skladištar";

  // ── List header (search, filters, stats — all scroll with the list) ──────────
  const ListHeader = () => (
    <>
      {/* Search + filters */}
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pretraži servisera ili rezervni dio"
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.filterRows}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterChip, statusFilter === filter.value && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, statusFilter === filter.value && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.filterDivider} />
            {SORT_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterChip, sortOrder === filter.value && styles.filterChipActive]}
                onPress={() => setSortOrder(filter.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, sortOrder === filter.value && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Stat cards row — matches manager layout */}
      <View style={styles.statCardsRow}>
        <StatCard label="Ispunjeno danas" value={String(fulfilledToday)} />
        <StatCard label="Na čekanju"      value={String(pendingCount)}   />
      </View>

      {/* List header row */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>NARUDŽBE</Text>
        <Text style={styles.listCount}>{filteredOrders.length} prikazano</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header — stays fixed at top */}
      <View style={styles.header}>
        <Image
          source={require("../public/centrometalLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerUser}>
          <Text style={styles.headerName}>{displayName}</Text>
          <Text style={styles.headerRole}>Skladištar</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.white} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.sparePartsOrderID)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onOpen={setSelectedOrder}
              onFulfill={handleFulfill}
              fulfilling={fulfillingId === item.sparePartsOrderID}
            />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nema narudžbi za prikaz.</Text>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.75}
      >
        <Text style={styles.logoutText}>Odjava</Text>
      </TouchableOpacity>

      {/* Detail modal */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{getOrderNumber(selectedOrder)}</Text>
                    <Text style={styles.modalSubtitle}>{getTechnicianName(selectedOrder)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Text style={styles.closeText}>Zatvori</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {selectedOrder.items.map((item) => (
                    <View key={item.itemID} style={styles.modalItemRow}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemQty}>x{item.quantity}</Text>
                    </View>
                  ))}
                </ScrollView>

                {selectedOrder.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.modalFulfillButton, fulfillingId && styles.disabledButton]}
                    disabled={!!fulfillingId}
                    onPress={() => handleFulfill(selectedOrder)}
                  >
                    <Text style={styles.modalFulfillText}>Označi ispunjeno</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}