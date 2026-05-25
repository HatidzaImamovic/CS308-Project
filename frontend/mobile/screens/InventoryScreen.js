import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getParts, createPart, updatePart, deletePart } from "../services/api";

// ─── Validation ───────────────────────────────────────────────────────────────
const validateForm = (form, isEdit) => {
  const errors = {};
  if (!form.name.trim())
    errors.name = "Naziv je obavezan.";
  if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0)
    errors.price = "Unesite ispravnu cijenu.";
  if (form.stock === "" || isNaN(Number(form.stock)) || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))
    errors.stock = "Unesite ispravnu zalihu (cijeli broj).";
  return errors;
};

// ─── Part form modal ──────────────────────────────────────────────────────────
const PartFormModal = ({ visible, onClose, onSave, editPart }) => {
  const isEdit = !!editPart;
  const EMPTY  = { name: "", description: "", price: "", stock: "" };

  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setForm(
        isEdit
          ? {
              name:        editPart.name        || "",
              description: editPart.description || "",
              price:       String(editPart.price ?? ""),
              stock:       String(editPart.stock ?? ""),
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [visible, editPart]);

  const set = (field) => (val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleSave = async () => {
    const errs = validateForm(form, isEdit);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       Number(form.price),
        stock:       Number(form.stock),
      };
      await onSave(payload, isEdit ? editPart.partID : null);
      onClose();
    } catch (err) {
      Alert.alert("Greška", err?.message || "Nije moguće spremiti.");
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
            <Text style={styles.modalTitle}>{isEdit ? "Uredi dio" : "Novi dio"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <Text style={styles.fieldLabel}>Naziv</Text>
            <TextInput
              style={[styles.input, !!errors.name && styles.inputError]}
              value={form.name}
              onChangeText={set("name")}
              placeholder="npr. Filter"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {!!errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

            {/* Description */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Opis (neobavezno)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
              value={form.description}
              onChangeText={set("description")}
              placeholder="Kratki opis dijela..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              autoCorrect={false}
            />

            {/* Price + Stock row */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Cijena (KM)</Text>
                <TextInput
                  style={[styles.input, !!errors.price && styles.inputError]}
                  value={form.price}
                  onChangeText={set("price")}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="decimal-pad"
                />
                {!!errors.price && <Text style={styles.fieldError}>{errors.price}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Zaliha (kom)</Text>
                <TextInput
                  style={[styles.input, !!errors.stock && styles.inputError]}
                  value={form.stock}
                  onChangeText={set("stock")}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                />
                {!!errors.stock && <Text style={styles.fieldError}>{errors.stock}</Text>}
              </View>
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>{isEdit ? "Spremi promjene" : "Dodaj dio"}</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Part card ────────────────────────────────────────────────────────────────
const PartCard = ({ item, onEdit, onDelete }) => {
  const inStock   = item.stock > 0;
  const stockColor = item.stock === 0 ? "#E05A5A" : item.stock < 5 ? "#E8A838" : "#5CB85C";

  return (
    <View style={styles.partCard}>
      <View style={styles.partInfo}>
        <Text style={styles.partName}>{item.name}</Text>
        {!!item.description && (
          <Text style={styles.partDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.partMeta}>
          <Text style={styles.partPrice}>{Number(item.price).toFixed(2)} KM</Text>
          <View style={[styles.stockBadge, { backgroundColor: stockColor + "25" }]}>
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: stockColor }]}>
              {inStock ? `${item.stock} kom` : "Nema"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(item)}
          activeOpacity={0.75}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item)}
          activeOpacity={0.75}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function InventoryScreen({ route, navigation }) {
  const [parts,        setParts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPart,  setEditingPart]  = useState(null);
  const [stockFilter,  setStockFilter]  = useState("all");

  const loadParts = useCallback(async () => {
    try {
      const data = await getParts();
      setParts(data || []);
    } catch (err) {
      Alert.alert("Greška", "Nije moguće učitati dijelove.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadParts(); }, [loadParts]));

  const onRefresh = () => { setRefreshing(true); loadParts(); };

  const handleOpenCreate = () => { setEditingPart(null); setModalVisible(true); };
  const handleOpenEdit   = (p) => { setEditingPart(p);   setModalVisible(true); };

  const handleSave = async (payload, partID) => {
    if (partID) {
      const updated = await updatePart(partID, payload);
      setParts((prev) => prev.map((p) => p.partID === partID ? { ...p, ...updated } : p));
    } else {
      const created = await createPart(payload);
      setParts((prev) => [...prev, created]);
    }
  };

  const handleDelete = (p) => {
    Alert.alert(
      "Brisanje dijela",
      `Sigurno želite obrisati "${p.name}"?`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Da, obriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePart(p.partID);
              setParts((prev) => prev.filter((x) => x.partID !== p.partID));
            } catch (err) {
              Alert.alert("Greška", err?.message || "Brisanje nije uspjelo.");
            }
          },
        },
      ]
    );
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = parts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStock  =
      stockFilter === "all"      ? true :
      stockFilter === "instock"  ? p.stock > 0 :
      stockFilter === "low"      ? p.stock > 0 && p.stock < 5 :
      stockFilter === "empty"    ? p.stock === 0 : true;
    return matchesSearch && matchesStock;
  });

  const totalValue = parts.reduce((s, p) => s + Number(p.price) * Number(p.stock), 0);
  const lowCount   = parts.filter((p) => p.stock > 0 && p.stock < 5).length;
  const emptyCount = parts.filter((p) => p.stock === 0).length;

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
        <Text style={styles.headerTitle}>Inventar</Text>
        <View style={{ width: 80 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.partID)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 40 }} />
            : <Text style={styles.emptyText}>Nema dijelova koji odgovaraju filteru.</Text>
        }
        ListHeaderComponent={
          <>
            {/* Welcome */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Inventar dijelova</Text>
              <Text style={styles.welcomeSubtitle}>Pregled, dodavanje i uređivanje dijelova</Text>
            </View>

            {/* Stat cards */}
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{parts.length}</Text>
                <Text style={styles.statLabel}>Ukupno</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#E8A838" }]}>{lowCount}</Text>
                <Text style={styles.statLabel}>Malo zalihe</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#E05A5A" }]}>{emptyCount}</Text>
                <Text style={styles.statLabel}>Nema zalihe</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#5CB85C", fontSize: 14 }]}>
                  {totalValue.toFixed(0)} KM
                </Text>
                <Text style={styles.statLabel}>Vrijednost</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Pretraži dijelove..."
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

            {/* Stock filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {[
                { label: "Svi",         value: "all"     },
                { label: "Na stanju",   value: "instock" },
                { label: "Malo zalihe", value: "low"     },
                { label: "Nema zalihe", value: "empty"   },
              ].map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterChip, stockFilter === f.value && styles.filterChipActive]}
                  onPress={() => setStockFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, stockFilter === f.value && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.resultsCount}>{filtered.length} prikazano</Text>
          </>
        }
        renderItem={({ item }) => <PartCard item={item} onEdit={handleOpenEdit} onDelete={handleDelete} />}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate} activeOpacity={0.85}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <PartFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingPart(null); }}
        onSave={handleSave}
        editPart={editingPart}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#446977" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#446977", paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#7aa7b8",
  },
  backBtn:     { width: 80 },
  backBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "700" },

  listContent: { padding: 20, paddingBottom: 100 },

  welcomeSection:  { marginBottom: 20, marginTop: 4 },
  welcomeTitle:    { color: "#ffffff", fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  welcomeSubtitle: { color: "#ffffff", fontSize: 14, marginTop: 4 },

  // Stats
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
  filterContent:        { gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "#ffffff",
  },
  filterChipActive:     { backgroundColor: "rgba(255,255,255,0.3)" },
  filterChipText:       { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { fontWeight: "700" },

  resultsCount: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 12 },

  // Part card
  partCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#7aa7b8", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#ffffff", marginBottom: 10,
  },
  partInfo:  { flex: 1 },
  partName:  { color: "#ffffff", fontSize: 15, fontWeight: "700", marginBottom: 3 },
  partDesc:  { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 6 },
  partMeta:  { flexDirection: "row", alignItems: "center", gap: 10 },
  partPrice: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  stockBadge: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  stockDot:  { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  stockText: { fontSize: 12, fontWeight: "700" },
  cardActions: { flexDirection: "column", gap: 6, marginLeft: 10 },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center", marginLeft: 10,
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(224,90,90,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 16 },

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

  emptyText: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 40, fontSize: 14 },

  // Modal
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

  twoCol:     { flexDirection: "row", marginTop: 14 },
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
  saveBtn: {
    backgroundColor: "#7aa7b8", borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 20,
    borderWidth: 1, borderColor: "#ffffff",
  },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});