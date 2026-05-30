import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getUsers, updateUser, deleteUser } from "../services/api";
import styles, { COLORS } from "./styles/managerHomeScreen";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["menadžer", "serviser", "skladištar"];

const ROLE_COLORS = {
  "menadžer":   COLORS.accent,
  "serviser":   COLORS.success,
  "skladištar": "#8fb3bf",
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
  if (!form.fName.trim())
    errors.fName = "Ime je obavezno.";
  else if (!ONLY_LETTERS.test(form.fName.trim()))
    errors.fName = "Ime smije sadržavati samo slova.";

  if (!form.lName.trim())
    errors.lName = "Prezime je obavezno.";
  else if (!ONLY_LETTERS.test(form.lName.trim()))
    errors.lName = "Prezime smije sadržavati samo slova.";

  if (!form.username.trim())
    errors.username = "Korisničko ime je obavezno.";
  else if (!USERNAME_RE.test(form.username.trim()))
    errors.username = "3–30 znakova, samo slova, brojevi, '.', '-', '_'.";

  if (!form.email.trim())
    errors.email = "Email je obavezan.";
  else if (!EMAIL_RE.test(form.email.trim()))
    errors.email = "Neispravan format email adrese.";

  if (!form.role) errors.role = "Uloga je obavezna.";
  return errors;
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ user }) => {
  const firstName   = user?.fName || user?.fname || user?.firstName || "";
  const lastName    = user?.lName || user?.lname || user?.lastName  || "";
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || "Menadžer";

  return (
    <View style={styles.header}>
      <Image
        source={require("../public/centrometalLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.headerUser}>
        <Text style={styles.headerName}>{displayName}</Text>
        <Text style={styles.headerRole}>Menadžer</Text>
      </View>
    </View>
  );
};

// ─── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const color = ROLE_COLORS[role] || COLORS.white;
  const label = ROLE_LABELS[role] || role;
  return (
    <View style={styles.roleBadge}>
      <View style={[styles.roleDot, { backgroundColor: color }]} />
      <Text style={styles.roleBadgeText}>{label}</Text>
    </View>
  );
};

// ─── Edit modal ───────────────────────────────────────────────────────────────
const EditUserModal = ({ visible, editingUser, onClose, onSave }) => {
  const [form,   setForm]   = useState({ fName: "", lName: "", username: "", email: "", role: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Uredi korisnika</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>×</Text>
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
                    <Text style={[styles.roleChipText, active && { color, fontWeight: "700" }]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.saveBtnText}>Spremi promjene</Text>}
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
  const roleColor = ROLE_COLORS[user.role] || COLORS.panel;

  return (
    <View style={styles.userCard}>
      <View style={[styles.userAvatar, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
        <Text style={[styles.userAvatarText, { color: roleColor }]}>
          {initials || "?"}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{firstName} {lastName}</Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        <RoleBadge role={user.role} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(user)} activeOpacity={0.75}>
          <Text style={styles.editBtnText}>Uredi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(user)} activeOpacity={0.75}>
          <Text style={styles.deleteBtnText}>Briši</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ role, count }) => {
  const color = ROLE_COLORS[role] || COLORS.white;
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
    return hay.includes(searchText.toLowerCase()) &&
      (!filterRole || u.role === filterRole);
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  // ── List header (stat cards + search + filter chips + narudžbe row) ──────────
  const ListHeader = () => (
    <>
      {/* Stat cards */}
      <View style={styles.statCardsRow}>
        {ROLES.map((r) => (
          <StatCard key={r} role={r} count={counts[r] || 0} />
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>Traži</Text>
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
            <Text style={styles.searchClear}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter chips */}
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

      {/* Narudžbe section — styled & scrolls like this user list */}
      <View style={styles.navSection}>
        <Text style={styles.sectionLabel}>NARUDŽBE</Text>
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("AllServiceOrders")}
            activeOpacity={0.82}
          >
            <Text style={styles.navCardTitle}>Svi servisni nalozi</Text>
            <Text style={styles.navCardSub}>Pregled svih naloga u sustavu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("Inventory")}
            activeOpacity={0.82}
          >
            <Text style={styles.navCardTitle}>Inventar dijelova</Text>
            <Text style={styles.navCardSub}>Stanje i upravljanje dijelovima</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User list header */}
      <View style={styles.userListHeader}>
        <Text style={styles.sectionLabel}>KORISNICI</Text>
        <Text style={styles.userListCount}>{filtered.length} prikazano</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Header user={user} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.white} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => String(u.userID || u.id)}
          renderItem={({ item }) => (
            <UserCard user={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText || filterRole
                ? "Nema korisnika koji odgovaraju filteru."
                : "Nema korisnika za prikaz."}
            </Text>
          }
          contentContainerStyle={styles.listContent}
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateUser", { user })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      <EditUserModal
        visible={modalVisible}
        editingUser={editingUser}
        onClose={() => { setModalVisible(false); setEditingUser(null); }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}