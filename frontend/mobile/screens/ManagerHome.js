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
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getUsers, updateUser, deleteUser } from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["menadžer", "serviser", "skladištar"];

const ROLE_COLORS = {
  "menadžer":   "#4EA8BE",
  "serviser":   "#5CB85C",
  "skladištar": "#E8A838",
};

const ROLE_LABELS = {
  "menadžer":   "Menadžer",
  "serviser":   "Serviser",
  "skladištar": "Skladištar",
};

// ─── Validation ───────────────────────────────────────────────────────────────
const ONLY_LETTERS = /^[A-Za-zÀ-žčćđšžČĆĐŠŽ\s'-]+$/;
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE  = /^[A-Za-z0-9._-]{3,30}$/;

const validateEditForm = (form) => {
  const errors = {};

  if (!form.fName.trim()) {
    errors.fName = "Ime je obavezno.";
  } else if (!ONLY_LETTERS.test(form.fName.trim())) {
    errors.fName = "Ime smije sadržavati samo slova.";
  }

  if (!form.lName.trim()) {
    errors.lName = "Prezime je obavezno.";
  } else if (!ONLY_LETTERS.test(form.lName.trim())) {
    errors.lName = "Prezime smije sadržavati samo slova.";
  }

  if (!form.username.trim()) {
    errors.username = "Korisničko ime je obavezno.";
  } else if (!USERNAME_RE.test(form.username.trim())) {
    errors.username = "3–30 znakova, samo slova, brojevi, '.', '-', '_'.";
  }

  if (!form.email.trim()) {
    errors.email = "Email je obavezan.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Neispravan format email adrese.";
  }

  if (!form.role) {
    errors.role = "Uloga je obavezna.";
  }

  return errors;
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ user }) => {
  const firstName = user?.fName || user?.fname || user?.firstName || "";
  const lastName  = user?.lName || user?.lname || user?.lastName  || "";
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || "Menadžer";

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconBox}>
          <Image
            source={require("../public/centrometalLogo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.headerUserInfo}>
          <Text style={styles.headerUserName}>{displayName}</Text>
          <Text style={styles.headerUserRole}>Menadžer</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const color = ROLE_COLORS[role] || "#fff";
  const label = ROLE_LABELS[role] || role;
  return (
    <View style={[styles.roleBadge, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
      <View style={[styles.roleDot, { backgroundColor: color }]} />
      <Text style={[styles.roleBadgeText, { color: "#fff" }]}>{label}</Text>
    </View>
  );
};

// ─── Edit modal ───────────────────────────────────────────────────────────────
const EditUserModal = ({ visible, editingUser, onClose, onSave }) => {
  const [form,   setForm]   = useState({ fName: "", lName: "", username: "", email: "", role: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when modal opens
  React.useEffect(() => {
    if (visible && editingUser) {
      setForm({
        fName:    editingUser.fName    || editingUser.fname || "",
        lName:    editingUser.lName    || editingUser.lname || "",
        username: editingUser.username || "",
        email:    editingUser.email    || "",
        role:     editingUser.role     || "",
      });
      setErrors({});
    }
  }, [visible, editingUser]);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    const errs = validateEditForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        fName:    form.fName.trim(),
        lName:    form.lName.trim(),
        username: form.username.trim(),
        email:    form.email.trim().toLowerCase(),
        role:     form.role,
      };
      await onSave(editingUser.userID || editingUser.id, payload);
      onClose();
    } catch (err) {
      // username/email conflict comes back as 409 from the backend
      if (err?.message?.toLowerCase().includes("korisničko ime") ||
          err?.message?.toLowerCase().includes("username")) {
        setErrors((e) => ({ ...e, username: "Korisničko ime već postoji." }));
      } else if (err?.message?.toLowerCase().includes("email")) {
        setErrors((e) => ({ ...e, email: "Email već postoji." }));
      } else {
        Alert.alert("Greška", err?.message || "Nije moguće spremiti promjene.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Uredi korisnika</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name row */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Ime</Text>
                <TextInput
                  style={[styles.input, !!errors.fName && styles.inputError]}
                  value={form.fName}
                  onChangeText={set("fName")}
                  placeholder="Ante"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {!!errors.fName && <Text style={styles.fieldError}>{errors.fName}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Prezime</Text>
                <TextInput
                  style={[styles.input, !!errors.lName && styles.inputError]}
                  value={form.lName}
                  onChangeText={set("lName")}
                  placeholder="Horvat"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {!!errors.lName && <Text style={styles.fieldError}>{errors.lName}</Text>}
              </View>
            </View>

            {/* Username */}
            <Text style={styles.fieldLabel}>Korisničko ime</Text>
            <TextInput
              style={[styles.input, !!errors.username && styles.inputError]}
              value={form.username}
              onChangeText={set("username")}
              placeholder="ante.horvat"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!errors.username && <Text style={styles.fieldError}>{errors.username}</Text>}

            {/* Email */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email</Text>
            <TextInput
              style={[styles.input, !!errors.email && styles.inputError]}
              value={form.email}
              onChangeText={set("email")}
              placeholder="ante@tvrtka.hr"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

            {/* Role selector */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Uloga</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const active = form.role === r;
                const color  = ROLE_COLORS[r];
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleChip,
                      active && { backgroundColor: color + "33", borderColor: color },
                    ]}
                    onPress={() => set("role")(r)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.roleChipText,
                      active && { color, fontWeight: "700" },
                    ]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Spremi promjene</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── User card ────────────────────────────────────────────────────────────────
const UserCard = ({ user, onEdit, onDelete }) => {
  const firstName = user.fName || user.fname || "";
  const lastName  = user.lName || user.lname || "";
  const initials  = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const roleColor = ROLE_COLORS[user.role] || "#7aa7b8";

  return (
    <View style={styles.userCard}>
      {/* Avatar */}
      <View style={[styles.userAvatar, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
        <Text style={[styles.userAvatarText, { color: roleColor }]}>
          {initials || "?"}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{firstName} {lastName}</Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        <RoleBadge role={user.role} />
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(user)}
          activeOpacity={0.75}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(user)}
          activeOpacity={0.75}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ role, count }) => {
  const color = ROLE_COLORS[role] || "#fff";
  const label = ROLE_LABELS[role] || role;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statCardValue, { color }]}>{count}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ManagerHomeScreen({ route, navigation }) {
  const { user } = route?.params || {};

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searchText,   setSearchText]   = useState("");
  const [filterRole,   setFilterRole]   = useState(null);
  const [editingUser,  setEditingUser]  = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (err) {
      Alert.alert("Greška", "Nije moguće učitati korisnike.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const handleEdit = (u) => {
    setEditingUser(u);
    setModalVisible(true);
  };

  const handleSave = async (userId, payload) => {
    const updated = await updateUser(userId, payload);
    setUsers((prev) =>
      prev.map((u) => (u.userID || u.id) === userId ? { ...u, ...updated } : u)
    );
  };

  const handleDelete = (u) => {
    const firstName = u.fName || u.fname || "";
    const lastName  = u.lName || u.lname || "";
    Alert.alert(
      "Brisanje korisnika",
      `Sigurno želite obrisati korisnika "${firstName} ${lastName}"?`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Da, obriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(u.userID || u.id);
              setUsers((prev) =>
                prev.filter((x) => (x.userID || x.id) !== (u.userID || u.id))
              );
            } catch (err) {
              Alert.alert("Greška", err?.message || "Brisanje nije uspjelo.");
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) => {
    const hay = [
      u.fName || u.fname || "",
      u.lName || u.lname || "",
      u.username || "",
      u.email    || "",
    ].join(" ").toLowerCase();
    return hay.includes(searchText.toLowerCase()) && (!filterRole || u.role === filterRole);
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />
      <Header user={user} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Welcome ──────────────────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Korisnici sustava</Text>
          <Text style={styles.welcomeSubtitle}>
            Pregled i uređivanje registriranih korisnika
          </Text>
        </View>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <View style={styles.statCardsRow}>
          {ROLES.map((r) => (
            <StatCard key={r} role={r} count={counts[r] || 0} />
          ))}
        </View>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Pretraži korisnike..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!searchText && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Role filter chips ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !filterRole && styles.filterChipActive]}
            onPress={() => setFilterRole(null)}
            activeOpacity={0.75}
          >
            <Text style={styles.filterChipText}>Svi ({users.length})</Text>
          </TouchableOpacity>

          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, filterRole === r && styles.filterChipActive]}
              onPress={() => setFilterRole(filterRole === r ? null : r)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterChipText}>
                {ROLE_LABELS[r]} ({counts[r] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── User list ────────────────────────────────────────────────── */}
        <View style={styles.userList}>
          <View style={styles.userListHeader}>
            <Text style={styles.userListLabel}>KORISNICI</Text>
            <Text style={styles.userListCount}>{filtered.length} prikazano</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchText || filterRole
                ? "Nema korisnika koji odgovaraju filteru."
                : "Nema korisnika za prikaz."}
            </Text>
          ) : (
            filtered.map((u) => (
              <UserCard key={u.userID || u.id} user={u} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </View>

        {/* Inventory button */}
        <TouchableOpacity
          style={styles.serviceOrdersBtn}
          onPress={() => navigation.navigate("Inventory")}
          activeOpacity={0.8}
        >
          <Text style={styles.serviceOrdersBtnText}>🔧  Inventar dijelova</Text>
        </TouchableOpacity>

        {/* Service orders button */}
        <TouchableOpacity
          style={styles.serviceOrdersBtn}
          onPress={() => navigation.navigate("AllServiceOrders")}
          activeOpacity={0.8}
        >
          <Text style={styles.serviceOrdersBtnText}>📋  Svi servisni nalozi</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.75}
        >
          <Text style={styles.logoutText}>Odjava</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateUser", { user })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      <EditUserModal
        visible={modalVisible}
        editingUser={editingUser}
        onClose={() => { setModalVisible(false); setEditingUser(null); }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#446977" },

  // Header — identical to HomeScreen
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#446977", paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#7aa7b8",
  },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBox:  { width: 60, height: 60, borderRadius: 12, backgroundColor: "#446977", alignItems: "center", justifyContent: "center" },
  logoImage:      { width: 200, height: 100, resizeMode: "contain", marginLeft: 115 },
  headerRight:    { flexDirection: "row", alignItems: "center", gap: 10 },
  headerUserInfo: { alignItems: "flex-end" },
  headerUserName: { color: "#ffffff", fontSize: 20, fontWeight: "600" },
  headerUserRole: { color: "#bec5d5", fontSize: 17, marginTop: 1 },

  // Scroll
  scrollView:    { flex: 1, backgroundColor: "#446977" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Welcome
  welcomeSection:  { marginBottom: 24, marginTop: 8 },
  welcomeTitle:    { color: "#ffffff", fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  welcomeSubtitle: { color: "#ffffff", fontSize: 14, marginTop: 4 },

  // Stat cards
  statCardsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: "#7aa7b8", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 10, alignItems: "center",
    borderWidth: 1, borderColor: "#ffffff",
  },
  statCardValue: { fontSize: 28, fontWeight: "700" },
  statCardLabel: { color: "#ffffff", fontSize: 11, marginTop: 3, textAlign: "center" },

  // Search
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#7aa7b8",
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: "#ffffff", marginBottom: 12,
  },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 14 },
  searchClear: { color: "rgba(255,255,255,0.7)", fontSize: 14, paddingLeft: 8 },

  // Filter chips
  filterScroll:     { marginBottom: 20 },
  filterContent:    { gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "#ffffff",
  },
  filterChipActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  filterChipText:   { color: "#ffffff", fontSize: 12, fontWeight: "600" },

  // User list container
  userList: {
    backgroundColor: "#7aa7b8", borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: "#ffffff", marginBottom: 24,
  },
  userListHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  userListLabel: { color: "#ffffff", fontSize: 14, fontWeight: "700", letterSpacing: 1.2 },
  userListCount: { color: "#d8e3ea", fontSize: 13, fontWeight: "700" },
  emptyText:     { color: "#ffffff", fontSize: 14, textAlign: "center", paddingVertical: 20 },

  // User card
  userCard: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  userAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  userAvatarText: { fontSize: 17, fontWeight: "800" },
  userInfo:       { flex: 1 },
  userName:       { color: "#ffffff", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  userUsername:   { color: "#d8e3ea", fontSize: 12 },
  userEmail:      { color: "#d8e3ea", fontSize: 11, marginTop: 1 },

  // Edit & delete buttons
  cardActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  editBtnText:   { fontSize: 16 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(224,90,90,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 16 },

  // Role badge
  roleBadge: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 5,
  },
  roleDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },

  // Logout
  serviceOrdersBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#ffffff", borderRadius: 12,
    paddingVertical: 16, backgroundColor: "#7aa7b8", marginBottom: 12,
  },
  serviceOrdersBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },

  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#ffffff", borderRadius: 12,
    paddingVertical: 16, gap: 8, backgroundColor: "#7aa7b8",
  },
  logoutText: { color: "#e05a5a", fontSize: 15, fontWeight: "600" },

  // FAB
  fab: {
    position: "absolute", bottom: 32, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#ffffff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  fabText: { color: "#446977", fontSize: 30, fontWeight: "300", lineHeight: 34 },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    backgroundColor: "#446977",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1, borderColor: "#7aa7b8",
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#7aa7b8",
  },
  modalTitle:    { color: "#ffffff", fontSize: 18, fontWeight: "800" },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  modalCloseText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  modalBody:      { paddingHorizontal: 20, paddingTop: 18 },

  // Form
  nameRow:    { flexDirection: "row", marginBottom: 14 },
  fieldLabel: {
    color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6,
  },
  fieldError: { color: "#ffb3b3", fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: "#ffffff", fontSize: 14,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  inputError: { borderColor: "#ffb3b3" },

  // Role selector
  roleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  roleChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
  },
  roleChipText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },

  // Save button
  saveBtn: {
    backgroundColor: "#7aa7b8", borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 20,
    borderWidth: 1, borderColor: "#ffffff",
  },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});