import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

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
  headerSpacer: { width: 44 },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollView: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20 },

  // ── Form card ────────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: COLORS.white,
  },
  inputError: { borderColor: COLORS.danger },
  dropdown: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 15, color: COLORS.white },
  placeholderText: { fontSize: 15, color: COLORS.muted },
  dropdownArrow: { fontSize: 12, color: COLORS.muted },
  errorText: { fontSize: 13, color: COLORS.danger, marginTop: 5 },
  helperText: { fontSize: 13, color: COLORS.muted, marginBottom: 10 },

  // ── Summary ──────────────────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  totalBox: {
    backgroundColor: "rgba(42,184,196,0.10)",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(42,184,196,0.25)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  summaryValue: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  totalLabel:   { color: COLORS.muted, fontSize: 15, fontWeight: "700" },
  totalValue:   { color: COLORS.white, fontSize: 20, fontWeight: "800" },

  // ── Parts ────────────────────────────────────────────────────────────────────
  partRow: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  partInfo:  { marginBottom: 10 },
  partName:  { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  partMeta:  { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  quantityInput: {
    width: 48,
    height: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    marginHorizontal: 8,
    textAlign: "center",
    color: COLORS.white,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  partTotal: { marginLeft: "auto", color: COLORS.white, fontSize: 14, fontWeight: "700" },

  // ── Buttons ──────────────────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  submitButtonText:    { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  secondaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },

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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    width: width * 0.8,
    maxHeight: height * 0.6,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalOptionText: { fontSize: 16, color: COLORS.white },
  modalCancel:     { padding: 15, alignItems: "center" },
  modalCancelText: { fontSize: 16, color: COLORS.danger, fontWeight: "600" },
});
