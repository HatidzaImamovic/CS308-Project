import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#1ca8b2',
  background: '#446977',
  cardBg: '#7aa7b8',
  white: '#ffffff',
  error: '#ff3232',
  muted: 'rgba(255,255,255,0.6)',
  success: '#4caf50',
  warning: '#f59e0b',
  cancelled: '#ff3232',
};

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 50,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  topbarTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  topbarLink: { fontSize: 13, fontWeight: 'bold', color: COLORS.white },
  searchInput: {
    borderWidth: 2, borderColor: COLORS.white,
    padding: 12, margin: 12, borderRadius: 15,
    color: COLORS.white, backgroundColor: COLORS.cardBg, fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.cardBg, borderWidth: 1,
    borderColor: COLORS.white, borderRadius: 14,
    padding: 14, marginHorizontal: 12, marginVertical: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)', gap: 10,
  },
  partName: { fontSize: 14, fontWeight: 'bold', color: COLORS.white, marginBottom: 2 },
  partStock: { fontSize: 12, color: COLORS.muted },
  partPrice: { fontSize: 13, fontWeight: 'bold', color: COLORS.white },
  addButton: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.2)' },
  addButtonText: { color: COLORS.white, fontSize: 20, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.primary, padding: 15,
    borderRadius: 10, alignItems: 'center',
    marginTop: 15, width: '70%', alignSelf: 'center',
  },
  buttonDisabled: { backgroundColor: 'rgba(255,255,255,0.2)' },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  backButton: { fontSize: 13, color: COLORS.white, fontWeight: 'bold' },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 14 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { color: COLORS.white, fontSize: 14 },
  qtyNum: { fontSize: 14, fontWeight: 'bold', color: COLORS.white, minWidth: 16, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: { fontSize: 14, color: COLORS.muted },
  totalVal: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  pillText: { fontSize: 11, fontWeight: 'bold' },
});