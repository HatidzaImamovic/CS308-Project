import { StyleSheet, Platform } from "react-native";

export const COLORS = {
  bg:      "#1a3a3f",
  panel:   "#1e5c6b",
  accent:  "#2ab8c4",
  white:   "#f0f4f6",
  muted:   "#8fb3bf",
  success: "#3dba7a",
  warning: "#2ab8c4",
  danger:  "#e05a5a",
};

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  logo: { width: 170, height: 70 },
  headerUser: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerName: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  headerRole: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  // ── List content padding ─────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText:   { color: COLORS.muted, fontSize: 14, textAlign: "center", paddingVertical: 20 },

  // ── Stat cards row ───────────────────────────────────────────────────────────
  statCardsRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingTop: 18 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statCardValue: { fontSize: 28, fontWeight: "700", color: COLORS.white },
  statCardLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3, textAlign: "center" },

  // ── Search ───────────────────────────────────────────────────────────────────
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  searchIcon:  { fontSize: 14, marginRight: 8, color: COLORS.muted },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 14 },
  searchClear: { color: COLORS.muted, fontSize: 14, paddingLeft: 8 },

  // ── Filter chips ─────────────────────────────────────────────────────────────
  filterScroll:  { marginBottom: 18 },
  filterContent: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterChipActive:     { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText:       { color: COLORS.white, fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: COLORS.white, fontWeight: "700" },

  // ── Nav cards section ────────────────────────────────────────────────────────
  navSection:   { marginBottom: 18 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  navGrid: { gap: 10 },
  navCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  navCardTitle: { color: COLORS.white, fontSize: 15, fontWeight: "700", marginBottom: 3 },
  navCardSub:   { color: COLORS.muted, fontSize: 12 },

  // ── User list header ─────────────────────────────────────────────────────────
  userListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  userListCount: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },

  // ── User card ────────────────────────────────────────────────────────────────
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: { fontSize: 17, fontWeight: "800", color: COLORS.white },
  userInfo:       { flex: 1 },
  userName:       { color: COLORS.white, fontSize: 15, fontWeight: "700", marginBottom: 2 },
  userUsername:   { color: COLORS.muted, fontSize: 12 },
  userEmail:      { color: COLORS.muted, fontSize: 11, marginTop: 1 },

  // ── Edit / delete buttons ────────────────────────────────────────────────────
  cardActions:   { flexDirection: "column", gap: 6, marginLeft: 8 },
  editBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  editBtnText:   { fontSize: 13, color: COLORS.white, fontWeight: "700" },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "rgba(224,90,90,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 13, color: COLORS.danger, fontWeight: "700" },

  // ── Role badge ───────────────────────────────────────────────────────────────
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  roleDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.white },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(224,90,90,0.35)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(224,90,90,0.10)",
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: "700" },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 88,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: COLORS.white, fontSize: 30, fontWeight: "300", lineHeight: 34 },

  // ── Edit user modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  modalBody:      { paddingHorizontal: 20, paddingTop: 18 },

  // ── Form ─────────────────────────────────────────────────────────────────────
  nameRow:    { flexDirection: "row", marginBottom: 14 },
  fieldLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldError: { color: COLORS.danger, fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 4,
  },
  inputError: { borderColor: COLORS.danger },
  roleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  roleChipText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
});
