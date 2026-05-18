import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { getServiceOrders } from "../services/api";
import styles from "./styles/homeScreen";

const DRAFTS_STORAGE_KEY = (userId) => `SERVICE_ORDER_DRAFTS_${userId}`;

const normalizeUserName = (user) => {
  const firstName =
    user?.fName || user?.fname || user?.firstName || user?.first_name;
  const lastName =
    user?.lName || user?.lname || user?.lastName || user?.last_name;
  if (firstName && lastName) {
    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }

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

const Header = ({ user }) => {
  const { firstName, lastName } = normalizeUserName(user);
  const userRole = user?.role || "Serviser";

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconBox}>
          <Image
            source={require("../public/centrometalLogo.png")}
            style={styles.logoImage}
          />
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.headerUserInfo}>
          <Text style={styles.headerUserName}>
            {firstName && lastName
              ? `${firstName} ${lastName}`
              : firstName
                ? firstName
                : "Korisnik"}
          </Text>
          <Text style={styles.headerUserRole}>{userRole}</Text>
        </View>
      </View>
    </View>
  );
};

const ActionCard = ({ iconSource, title, subtitle, onPress, style }) => (
  <TouchableOpacity
    style={[styles.actionCard, style]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.actionIconBox}>
      <Image source={iconSource} style={styles.actionIcon} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function HomeScreen({ route, navigation }) {
  const { user } = route?.params || {};
  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  const handleKreirajNalog = () => {
    navigation.navigate("ServiceOrder", { user });
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

  const getOrderTitle = (order) => {
    const typeLabel = getTypeText(normalizeOrderType(order));
    return typeLabel;
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
      return `#${order.serviceOrderID || order.id || ""}`;

    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const dayLabel =
      date.toDateString() === today
        ? "Danas"
        : date.toDateString() === yesterday.toDateString()
          ? "Jučer"
          : date.toLocaleDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `#${order.serviceOrderID || order.id || ""} · ${dayLabel}${time ? `, ${time}` : ""}`;
  };

  const getOrderStatusText = (order) =>
    order.isDraft || Number(order.status) === 0 ? "Otvoren" : "Zatvoren";

  const handleShowAllRecent = () => {
    navigation.navigate("ServiceOrder", { user });
  };

  const handleRecentOrderPress = (order) => {
    if (order.isDraft) {
      navigation.navigate("CreateServiceOrder", { user, draft: order });
      return;
    }

    Alert.alert(
      `Nalog #${order.serviceOrderID || order.id}`,
      `Tip: ${getOrderTitle(order)}\nDatum: ${formatOrderDate(order)}\nStatus: ${getOrderStatusText(order)}\n${order.description ? `\nOpis: ${order.description}` : ""}`,
      [{ text: "OK" }],
    );
  };

  useFocusEffect(
    useCallback(() => {
      const loadCounts = async () => {
        const userId = user?.id || user?.userID;
        if (!userId) {
          setOpenCount(0);
          setClosedCount(0);
          setRecentOrders([]);
          return;
        }

        try {
          const orders = await getServiceOrders(userId);
          const draftsJson = await AsyncStorage.getItem(
            DRAFTS_STORAGE_KEY(userId),
          );
          const drafts = draftsJson ? JSON.parse(draftsJson) : [];
          const draftOrders = drafts.map((draft) => ({
            ...draft,
            isDraft: true,
          }));
          const backendOrders = orders.map((order) => ({
            ...order,
            isDraft: false,
          }));

          const openBackend = backendOrders.filter(
            (order) => Number(order.status) === 0,
          ).length;
          const closedBackend = backendOrders.filter(
            (order) => Number(order.status) === 1,
          ).length;
          const openDrafts = draftOrders.length;

          setOpenCount(openBackend + openDrafts);
          setClosedCount(closedBackend);

          const recentCombined = [...draftOrders, ...backendOrders]
            .sort((a, b) => {
              const aTime = new Date(
                a.createdAt || a.date || a.updatedAt || 0,
              ).getTime();
              const bTime = new Date(
                b.createdAt || b.date || b.updatedAt || 0,
              ).getTime();
              return bTime - aTime;
            })
            .slice(0, 3);

          setRecentOrders(recentCombined);
        } catch (err) {
          console.error("Error loading order counts:", err);
          setOpenCount(0);
          setClosedCount(0);
          setRecentOrders([]);
        }
      };

      loadCounts();
    }, [user]),
  );

const handleShop = () => {
  navigation.navigate('Catalogue', { user });
};

  const handleFinancije = () => {
    navigation.navigate('Financije', { user });
  };

  const handleOdjava = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />
      <Header user={user} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Dobrodošli natrag</Text>
          <Text style={styles.welcomeSubtitle}>
            Odaberite akciju s kojom želite nastaviti
          </Text>
        </View>

        <View style={styles.cardsRow}>
          <ActionCard
            iconSource={require("../public/nalog.png")}
            title="Servisni nalog"
            subtitle="Dodaj novi nalog ili nastavi s postojećim"
            onPress={handleKreirajNalog}
            style={styles.actionCard}
          />
          <ActionCard
            iconSource={require("../public/shop.png")}
            title="Shop"
            subtitle="Rezervni dijelovi i oprema"
            onPress={handleShop}
            style={styles.actionCard}
          />
          <ActionCard
            iconSource={require("../public/financije.png")}
            title="Financije"
            subtitle="Računi, plaćanja i izvještaji"
            onPress={handleFinancije}
            style={[styles.actionCard, styles.actionCardLast]}
          />
        </View>

        <TouchableOpacity
          style={styles.quickOverview}
          activeOpacity={0.85}
          onPress={handleKreirajNalog}
        >
          <Text style={styles.quickOverviewLabel}>BRZI PREGLED</Text>
          <View style={styles.statsRow}>
            <StatBox label="Otvoreni servisi" value={String(openCount)} />
            <View style={styles.statDivider} />
            <StatBox label="Završeni servisi" value={String(closedCount)} />
          </View>
        </TouchableOpacity>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentSectionLabel}>NEDAVNI NALOZI</Text>
            <TouchableOpacity onPress={handleShowAllRecent} activeOpacity={0.7}>
              <Text style={styles.recentHeaderLink}>Prikaži sve →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <Text style={styles.recentEmptyText}>
              Nema nedavnih naloga za prikaz.
            </Text>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id || order.serviceOrderID || order.createdAt}
                style={styles.recentItem}
                activeOpacity={0.8}
                onPress={() => handleRecentOrderPress(order)}
              >
                <View style={styles.recentItemRow}>
                  <View style={styles.recentStatusDot} />
                  <View style={styles.recentItemLeft}>
                    <Text style={styles.recentItemType}>
                      {getRecentOrderTitle(order)}
                    </Text>
                    <Text style={styles.recentItemSubtitle}>
                      {formatOrderSubtitle(order)}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentItemStatus}>
                  <Text style={styles.recentItemStatusText}>
                    {getOrderStatusText(order)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleOdjava}
          activeOpacity={0.75}
        >
          <Text style={styles.logoutText}>Odjava</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
