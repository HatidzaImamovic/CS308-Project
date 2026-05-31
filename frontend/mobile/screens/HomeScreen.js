import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getServiceOrders,
  getDrafts,
  createServiceOrder,
  removeDraftById,
} from "../services/api";
import config from "../config";
import styles, { COLORS } from "./styles/homeScreen";

const DRAFTS_STORAGE_KEY = (userId) => `SERVICE_ORDER_DRAFTS_${userId}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDisplayOrderNumber = (order) =>
  order.orderNumber ||
  order.serviceOrderNumber ||
  order.serviceOrderID ||
  order.id ||
  "";

const normalizeUserName = (user) => {
  const firstName =
    user?.fName || user?.fname || user?.firstName || user?.first_name;
  const lastName =
    user?.lName || user?.lname || user?.lastName || user?.last_name;
  if (firstName && lastName)
    return { firstName: firstName.trim(), lastName: lastName.trim() };

  const fullName = (user?.name || user?.username || "").trim();
  if (fullName.includes(" ")) {
    const [first, ...rest] = fullName.split(/\s+/);
    return { firstName: first, lastName: rest.join(" ") };
  }
  return {
    firstName: firstName?.trim() || fullName || "",
    lastName: lastName?.trim() || "",
  };
};

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
  const rawType = (order.type || order.serviceType || "")
    .toString()
    .trim()
    .toLowerCase();
  if (rawType.includes("install") || rawType.includes("instal"))
    return "installation";
  if (rawType.includes("poprav")) return "repair";
  if (
    rawType.includes("održ") ||
    rawType.includes("odrz") ||
    rawType.includes("odrzav")
  )
    return "maintenance";
  if (["installation", "repair", "maintenance"].includes(rawType))
    return rawType;
  return rawType;
};

const formatOrderDate = (order) => {
  const dateValue = order.createdAt || order.date || order.updatedAt;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

const getRecentOrderTitle = (order) => {
  const typeLabel = getTypeText(normalizeOrderType(order));
  const customer = (
    order.name ||
    order.customerName ||
    order.customer ||
    ""
  ).trim();
  return customer ? `${typeLabel} — ${customer}` : typeLabel;
};

const formatOrderSubtitle = (order) => {
  const dateValue = order.createdAt || order.date || order.updatedAt;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime()))
    return `#${getDisplayOrderNumber(order)}`;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const dayLabel =
    date.toDateString() === now.toDateString()
      ? "Danas"
      : date.toDateString() === yesterday.toDateString()
        ? "Jučer"
        : date.toLocaleDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `#${getDisplayOrderNumber(order)} · ${dayLabel}${time ? `, ${time}` : ""}`;
};

const getOrderStatusText = (order) =>
  order.isDraft || Number(order.status) === 0 ? "Otvoren" : "Zatvoren";

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ user }) => {
  const { firstName, lastName } = normalizeUserName(user);
  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || "Korisnik";
  const userRole = user?.role || "Serviser";

  return (
    <View style={styles.header}>
      <Image
        source={require("../public/centrometalLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.headerUser}>
        <Text style={styles.headerName}>{displayName}</Text>
        <Text style={styles.headerRole}>{userRole}</Text>
      </View>
    </View>
  );
};

// ─── Stat card (manager-style individual card) ────────────────────────────────
const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </View>
);

// ─── Order card (recent nalog) ────────────────────────────────────────────────
const OrderCard = ({ order, onPress }) => {
  const isDraft = order.isDraft || Number(order.status) === 0;

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => onPress(order)}
      activeOpacity={0.82}
    >
      <View style={styles.orderHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.orderTitle}>{getRecentOrderTitle(order)}</Text>
          <Text style={styles.orderSubtitle}>{formatOrderSubtitle(order)}</Text>
        </View>
        <View style={[styles.statusBadge, isDraft ? styles.pendingBadge : styles.doneBadge]}>
          <Text style={styles.statusText}>{getOrderStatusText(order)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ route, navigation }) {
  const { user } = route?.params || {};
  const [openCount,     setOpenCount]     = useState(0);
  const [closedCount,   setClosedCount]   = useState(0);
  const [recentOrders,  setRecentOrders]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const loadOrders = useCallback(async () => {
    const userId = user?.id || user?.userID;
    if (!userId) {
      setOpenCount(0);
      setClosedCount(0);
      setRecentOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const orders     = await getServiceOrders(userId);
      const drafts     = await getDrafts(userId);

      const draftOrders   = drafts.map((d) => ({ ...d, isDraft: true }));
      const backendOrders = orders.map((o) => ({ ...o, isDraft: false }));

      setOpenCount(draftOrders.length);
      setClosedCount(backendOrders.length);

      const combined = [...draftOrders, ...backendOrders].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });

      setRecentOrders(combined);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOpenCount(0);
      setClosedCount(0);
      setRecentOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [loadOrders])
  );

  useEffect(() => {
    let interval;
    const syncDrafts = async () => {
      const userId = user?.id || user?.userID;
      if (!userId) return;
      try {
        const response = await fetch(`${config.API_URL}/test`);
        if (!response.ok) return;
        const drafts = await getDrafts(userId);
        if (!drafts.length) return;

        for (const draft of drafts) {
          try {
            await createServiceOrder({
              ...draft,
              spareParts: draft.spareParts || [],
              userID: userId,
              status: 1,
            });
            await removeDraftById(userId, draft.id);
          } catch (err) {
            console.warn("Draft sync failed", err);
          }
        }
        loadOrders();
      } catch {
        // offline or not ready
      }
    };

    syncDrafts();
    interval = setInterval(syncDrafts, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [user, loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (order) => {
    if (order.isDraft) {
      navigation.navigate("CreateServiceOrder", { user, draft: order });
      return;
    }
    Alert.alert(
      `Nalog #${getDisplayOrderNumber(order)}`,
      `Tip: ${getTypeText(normalizeOrderType(order))}\nDatum: ${formatOrderDate(order)}\nStatus: ${getOrderStatusText(order)}${order.description ? `\n\nOpis: ${order.description}` : ""}`,
      [{ text: "OK" }]
    );
  };

  // ── List header (everything above the orders) ────────────────────────────────
  const ListHeader = () => (
    <>
      {/* Nav cards — full-width, matches manager navCard pattern */}
      <View style={styles.navSection}>
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate("ServiceOrder", { user })}
          activeOpacity={0.82}
        >
          <Image source={require("../public/nalog.png")} style={styles.navCardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navCardTitle}>Servisni nalog</Text>
            <Text style={styles.navCardSub}>Kreiraj i upravljaj nalozima</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate("Catalogue", { user })}
          activeOpacity={0.82}
        >
          <Image source={require("../public/shop.png")} style={styles.navCardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navCardTitle}>Shop</Text>
            <Text style={styles.navCardSub}>Pregled kataloga dijelova</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate("Financije", { user })}
          activeOpacity={0.82}
        >
          <Image source={require("../public/financije.png")} style={styles.navCardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navCardTitle}>Financije</Text>
            <Text style={styles.navCardSub}>Pregled troškova i prihoda</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.quickOverviewHeader}
        onPress={() => navigation.navigate("ServiceOrder", { user })}
        activeOpacity={0.75}
      >
        <Text style={styles.sectionLabel}>BRZI PREGLED</Text>
      </TouchableOpacity>

      {/* Stat cards row — matches manager layout */}
      <View style={styles.statCardsRow}>
        <StatCard label="Otvoreni" value={String(openCount)} />
        <StatCard label="Završeni" value={String(closedCount)} />
      </View>

      {/* Recent orders header */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>NEDAVNI NALOZI</Text>
        <Text style={styles.listCount}>{recentOrders.length} prikazano</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Header user={user} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.white} size="large" />
        </View>
      ) : (
        <FlatList
          data={recentOrders}
          keyExtractor={(item) =>
            String(item.id || item.serviceOrderID || item.createdAt)
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={handleOrderPress} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nema naloga za prikaz.</Text>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.75}
      >
        <Text style={styles.logoutText}>Odjava</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
