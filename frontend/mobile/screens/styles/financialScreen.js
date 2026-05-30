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
  container: {
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
  headerSpacer: { width: 44 },

  // ── Filter bar ───────────────────────────────────────────────────────────────
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterScroll: { flexGrow: 0 },
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
  list: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
    marginRight: 10,
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDate: {
    color: COLORS.muted,
    fontSize: 12,
  },
  cardAmount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },

  // ── States ───────────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "600",
  },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.panel,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    width: "88%",
    maxHeight: "80%",
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 18,
    textAlign: "center",
  },
  detailRow: { marginBottom: 14 },
  detailLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  detailValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },
});