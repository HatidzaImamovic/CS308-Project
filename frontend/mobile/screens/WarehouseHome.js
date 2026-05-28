import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
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

const COLORS = {
  bg: "#446977",
  panel: "#7aa7b8",
  accent: "#1ca8b2",
  white: "#ffffff",
  muted: "#d8e3ea",
  success: "#5CB85C",
  warning: "#E8A838",
  danger: "#e05a5a",
};

const STATUS_FILTERS = [
  { label: "Sve", value: "all" },
  { label: "Otvorene", value: "pending" },
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

const StatBox = ({ label, value, color }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {pending && (
          <TouchableOpacity
            style={[styles.fulfillButton, fulfilling && styles.disabledButton]}
            disabled={fulfilling}
            onPress={(event) => {
              event?.stopPropagation?.();
              onFulfill(order);
            }}
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
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

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

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) => statusFilter === "all" || order.status === statusFilter)
      .filter((order) => {
        if (!query) return true;

        const technician = getTechnicianName(order).toLowerCase();
        const parts = order.items.map((item) => item.name || "").join(" ").toLowerCase();
        const number = getOrderNumber(order).toLowerCase();
        return technician.includes(query) || parts.includes(query) || number.includes(query);
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "pending" ? -1 : 1;
        }

        const aTime = new Date(a.submittedAt || 0).getTime();
        const bTime = new Date(b.submittedAt || 0).getTime();
        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [orders, search, sortOrder, statusFilter]);

  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const fulfilledToday = orders.filter(
    (order) => order.status === "completed" && isToday(order.fulfilledAt)
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleFulfill = async (order) => {
    try {
      setFulfillingId(order.sparePartsOrderID);
      await fulfillWarehouseOrder(order.sparePartsOrderID);
      await loadOrders();
      setSelectedOrder((current) =>
        current?.sparePartsOrderID === order.sparePartsOrderID
          ? { ...current, status: "completed", fulfilledAt: new Date().toISOString() }
          : current
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

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
                style={[
                  styles.filterChip,
                  statusFilter === filter.value && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(filter.value)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === filter.value && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}

            {SORT_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterChip,
                  sortOrder === filter.value && styles.filterChipActive,
                ]}
                onPress={() => setSortOrder(filter.value)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sortOrder === filter.value && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.quickOverview}>
        <Text style={styles.sectionLabel}>BRZI PREGLED</Text>
        <View style={styles.statsRow}>
          <StatBox label="Ispunjeno danas" value={String(fulfilledToday)} color={COLORS.success} />
          <View style={styles.statDivider} />
          <StatBox label="Narudžbe na čekanju" value={String(pendingCount)} color={COLORS.warning} />
        </View>
      </View>

      <View style={styles.listWrap}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>NARUDŽBE</Text>
          <Text style={styles.listCount}>{filteredOrders.length} prikazano</Text>
        </View>

        {loading ? (
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nema narudžbi za prikaz.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.75}
      >
        <Text style={styles.logoutText}>Odjava</Text>
      </TouchableOpacity>

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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#7aa7b8",
  },
  logo: { width: 170, height: 70 },
  headerUser: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerName: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  headerRole: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 16 },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderRadius: 12,
    color: COLORS.white,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterRows: { marginTop: 10 },
  filterContent: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  filterChipActive: {
    backgroundColor: "rgba(28,168,178,0.32)",
    borderColor: COLORS.white,
  },
  filterChipText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  filterChipTextActive: { color: COLORS.white },
  quickOverview: {
    margin: 20,
    marginBottom: 14,
    backgroundColor: COLORS.panel,
    borderColor: COLORS.white,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  sectionLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 32, fontWeight: "800" },
  statLabel: { color: COLORS.white, fontSize: 13, textAlign: "center", marginTop: 6 },
  statDivider: { width: 1, height: 42, backgroundColor: COLORS.white },
  listWrap: { flex: 1, paddingHorizontal: 20 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listCount: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  listContent: { paddingBottom: 20 },
  center: { paddingTop: 40 },
  emptyText: { color: COLORS.white, textAlign: "center", marginTop: 36 },
  orderCard: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.white,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderNumber: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  technician: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pendingBadge: { backgroundColor: "rgba(232,168,56,0.22)" },
  doneBadge: { backgroundColor: "rgba(92,184,92,0.22)" },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  itemSummary: { color: COLORS.white, fontSize: 14, lineHeight: 20 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  dateText: { color: COLORS.muted, fontSize: 11, flex: 1, paddingRight: 10 },
  fulfillButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fulfillButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  disabledButton: { opacity: 0.65 },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(224,90,90,0.14)",
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  modalSheet: {
    maxHeight: "78%",
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: { color: COLORS.white, fontSize: 22, fontWeight: "800" },
  modalSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  closeText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  modalBody: { marginBottom: 16 },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  modalItemName: { color: COLORS.white, fontSize: 15, fontWeight: "700", flex: 1 },
  modalItemQty: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  modalFulfillButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalFulfillText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
});
