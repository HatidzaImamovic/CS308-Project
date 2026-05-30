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
  open:    "#2ab8c4",
  closed:  "#3dba7a",
};

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  logo: { width: 150, height: 56 },
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

  // ── Nav section — full-width cards, matches manager navCard pattern ─────────
  navSection: {
    paddingTop: 14,
    gap: 10,
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.panel,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  navCardIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
    tintColor: COLORS.accent,
  },
  navCardTitle: { color: COLORS.white, fontSize: 15, fontWeight: "700", marginBottom: 2 },
  navCardSub:   { color: COLORS.muted, fontSize: 12 },

  // ── Stat cards row — individual cards, matches manager layout ─────────────
  statCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 0,
    marginBottom: 0,
  },
  quickOverviewHeader: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 4,
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
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  // ── Recent orders list ───────────────────────────────────────────────────────
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
    padding: 14,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderTitle:    { color: COLORS.white, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  orderSubtitle: { color: COLORS.muted, fontSize: 11 },
  statusBadge:   { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  pendingBadge:  { backgroundColor: "rgba(42,184,196,0.18)", borderWidth: 1, borderColor: "rgba(42,184,196,0.4)" },
  doneBadge:     { backgroundColor: "rgba(61,186,122,0.18)", borderWidth: 1, borderColor: "rgba(61,186,122,0.4)" },
  statusText:    { fontSize: 10, fontWeight: "800", color: COLORS.white },

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
});
