import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllServiceOrders } from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { label: "Svi",       value: "all"    },
  { label: "Zatvoreni", value: "closed" },
];

const TYPE_FILTERS = [
  { label: "Svi tipovi",  value: "all"          },
  { label: "Instalacija", value: "Instalacija"  },
  { label: "Popravak",    value: "Popravak"        },
  { label: "Održavanje",  value: "Održavanje"   },
];

const TYPE_COLORS = {
  installation: "#4EA8BE",
  repair:       "#E05A5A",
  maintenance:  "#E8A838",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTypeText = (type) => {
  switch ((type || "").toLowerCase()) {
    case "Instalacija": return "Instalacija";
    case "Popravak":       return "Popravak";
    case "Održavanje":  return "Održavanje";
    default:             return type || "Nepoznato";
  }
};

const formatDate = (val) => {
  if (!val) return "--";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "--" : d.toLocaleDateString();
};

// ─── Order card ───────────────────────────────────────────────────────────────
const OrderCard = ({ item }) => {
  const typeColor  = TYPE_COLORS[item.type] || "#7aa7b8";
  const typeLabel  = getTypeText(item.type);
  const isClosed   = Number(item.status) === 1;
  const statusText = isClosed ? "Zatvoren" : "Otvoren";
  const statusColor= isClosed ? "#5CB85C" : "#ffc107";
  const firstName  = item.fName || "";
  const lastName   = item.lName || "";
  const fullName   = firstName && lastName ? `${firstName} ${lastName}` : item.username || "Nepoznat";
  const total      = Number(item.totalAmount || 0);

  return (
    <View style={styles.orderCard}>
      {/* Top row: ID + status */}
      <View style={styles.orderTopRow}>
        <Text style={styles.orderId}>#{item.serviceOrderID}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "25" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeColor + "22" }]}>
        <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
      </View>

      {/* Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Serviser</Text>
          <Text style={styles.detailValue}>{fullName}</Text>
        </View>
        {!!item.serialNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serijski br.</Text>
            <Text style={styles.detailValue}>{item.serialNumber}</Text>
          </View>
        )}
        {!!item.name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ime</Text>
            <Text style={styles.detailValue}>{item.name}</Text>
          </View>
        )}
        {!!item.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lokacija</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Datum</Text>
          <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
        </View>
        {total > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Iznos</Text>
            <Text style={[styles.detailValue, styles.amountText]}>{total.toFixed(2)} KM</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AllServiceOrdersScreen({ route, navigation }) {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    try {
      const data = await getAllServiceOrders();
      setOrders(data || []);
    } catch (err) {
      Alert.alert("Greška", "Nije moguće učitati servisne naloge.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesType   = typeFilter === "all" || o.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open"   && Number(o.status) === 0) ||
        (statusFilter === "closed" && Number(o.status) === 1);

      const hay = [
        o.fName || "", o.lName || "", o.username || "",
        o.serialNumber || "", o.name || "", o.location || "",
        getTypeText(o.type),
      ].join(" ").toLowerCase();

      const matchesSearch = !q || hay.includes(q);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [orders, typeFilter, statusFilter, search]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const totalAmount = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const closedCount = orders.filter((o) => Number(o.status) === 1).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={styles.backBtnText}>← Natrag</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servisni nalozi</Text>
        <View style={{ width: 80 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.serviceOrderID)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Učitavanje...</Text>
          ) : (
            <Text style={styles.emptyText}>Nema naloga koji odgovaraju filteru.</Text>
          )
        }
        ListHeaderComponent={
          <>
            {/* Welcome */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Svi servisni nalozi</Text>
              <Text style={styles.welcomeSubtitle}>Pregled naloga svih servisera</Text>
            </View>

            {/* Stat cards */}
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Ukupno</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#5CB85C" }]}>{closedCount}</Text>
                <Text style={styles.statLabel}>Zatvoreni</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#4EA8BE", fontSize: 16 }]}>
                  {totalAmount.toFixed(0)} KM
                </Text>
                <Text style={styles.statLabel}>Prihod</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Pretraži po serviseru, lokaciji, serijskom broju..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
                  onPress={() => setStatusFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, statusFilter === f.value && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.filterDivider} />
              {TYPE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterChip, typeFilter === f.value && styles.filterChipActive]}
                  onPress={() => setTypeFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, typeFilter === f.value && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Results count */}
            <Text style={styles.resultsCount}>{filtered.length} prikazano</Text>
          </>
        }
        renderItem={({ item }) => <OrderCard item={item} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#446977" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#446977", paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#7aa7b8",
  },
  backBtn:     { width: 80 },
  backBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "700" },

  // List
  listContent: { padding: 20, paddingBottom: 40 },

  // Welcome
  welcomeSection:  { marginBottom: 20, marginTop: 4 },
  welcomeTitle:    { color: "#ffffff", fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  welcomeSubtitle: { color: "#ffffff", fontSize: 14, marginTop: 4 },

  // Stat row
  statRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: "#7aa7b8", borderRadius: 14,
    paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#ffffff",
  },
  statValue: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, marginTop: 2, textAlign: "center" },

  // Search
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#7aa7b8",
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: "#ffffff", marginBottom: 12,
  },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 14 },
  searchClear: { color: "rgba(255,255,255,0.7)", fontSize: 14, paddingLeft: 8 },

  // Filters
  filterScroll:         { marginBottom: 12 },
  filterContent:        { gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "#ffffff",
  },
  filterChipActive:     { backgroundColor: "rgba(255,255,255,0.3)" },
  filterChipText:       { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { fontWeight: "700" },
  filterDivider:        { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 4 },

  // Results
  resultsCount: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 12 },

  // Order card
  orderCard: {
    backgroundColor: "#7aa7b8", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#ffffff", marginBottom: 12,
  },
  orderTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderId:      { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  statusBadge:  { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot:    { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText:   { fontSize: 12, fontWeight: "700" },
  typeBadge:    { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  typeText:     { fontSize: 12, fontWeight: "700" },

  // Details grid
  detailsGrid: { gap: 5 },
  detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  detailValue: { color: "#ffffff", fontSize: 12, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  amountText:  { color: "#ffffff", fontWeight: "800", fontSize: 13 },

  // Empty
  emptyText: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 40, fontSize: 14 },
});