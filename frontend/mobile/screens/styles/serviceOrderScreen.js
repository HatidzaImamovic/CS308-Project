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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.bg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },

  // ── Filter bar ───────────────────────────────────────────────────────────────
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
  },
  searchInput: {
    backgroundColor: COLORS.panel,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterScroll: {
    marginTop: 12,
  },
  filterScrollContent: {
    flexDirection: "row",
    paddingBottom: 4,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },
  filterDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginLeft: 0,
    marginRight: 8,
    alignSelf: "center",
  },

  // ── Content ──────────────────────────────────────────────────────────────────
  content: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: { fontSize: 16, color: COLORS.muted },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  listContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // ── Order card ───────────────────────────────────────────────────────────────
  orderItem: {
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
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
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.white,
  },
  orderType: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 6,
  },
  orderLocation: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 6,
    lineHeight: 20,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.muted,
  },
  orderTotal: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  addButton: {
    position: "absolute",
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
  },
});