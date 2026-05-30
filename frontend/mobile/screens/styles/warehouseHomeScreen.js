import { StyleSheet } from "react-native";

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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  logo: { width: 140, height: 52 },
  headerUser: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerName: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  headerRole: { color: COLORS.muted, fontSize: 11, marginTop: 1 },

  // ── Search + filters ─────────────────────────────────────────────────────────
  searchWrap:  { paddingTop: 12 },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 14,
    color: COLORS.white,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  filterRows:    { marginTop: 10 },
  filterContent: { gap: 10, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterChipActive:     { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText:       { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: COLORS.white, fontWeight: "700" },
  filterDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 4,
  },

  // ── Stat cards row — individual cards, matches manager layout ────────────────
  statCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statCardValue: { fontSize: 28, fontWeight: "700", color: COLORS.white },
  statCardLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3, textAlign: "center" },

  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Order list ───────────────────────────────────────────────────────────────
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 8,
  },
  listCount:   { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  listContent: { paddingHorizontal: 20, paddingBottom: 16 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText:   { color: COLORS.muted, textAlign: "center", marginTop: 36 },

  // ── Order card ───────────────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: COLORS.panel,
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderNumber:  { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  technician:   { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  statusBadge:  { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  pendingBadge: {
    backgroundColor: "rgba(42,184,196,0.18)",
    borderWidth: 1,
    borderColor: "rgba(42,184,196,0.4)",
  },
  doneBadge: {
    backgroundColor: "rgba(61,186,122,0.18)",
    borderWidth: 1,
    borderColor: "rgba(61,186,122,0.4)",
  },
  statusText:   { fontSize: 10, fontWeight: "800", color: COLORS.white },
  itemSummary:  { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateText: { color: COLORS.muted, fontSize: 11, flex: 1, paddingRight: 10 },
  fulfillButton: {
    backgroundColor: COLORS.success,
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  fulfillButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  disabledButton:    { opacity: 0.5 },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(224,90,90,0.35)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "rgba(224,90,90,0.10)",
  },
  logoutText: { color: COLORS.danger, fontSize: 14, fontWeight: "700" },

  // ── Detail modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    maxHeight: "78%",
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle:    { color: COLORS.white, fontSize: 20, fontWeight: "800" },
  modalSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  closeText:     { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  modalBody:     { marginBottom: 16 },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalItemName: { color: COLORS.white, fontSize: 14, fontWeight: "700", flex: 1 },
  modalItemQty:  { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  modalFulfillButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalFulfillText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
});