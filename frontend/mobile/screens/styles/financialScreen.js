import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#446977',
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  backButton: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },

  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Chip rows (filter + sort scroll views) 

chipRow: {
  marginBottom: 10,
  flexGrow: 0,
  height: 44,  
},

chipRowLast: {
  marginBottom: 16,
  flexGrow: 0,
  height: 44,  
},


  chipRowContent: {
    gap: 8,
    paddingRight: 4,
  },

  // Summary box 

  summaryBox: {
    backgroundColor: '#7aa7b8',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 20,
    alignItems: 'center',
  },

  summaryLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1,
  },

  summaryAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },

  summaryCount: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },

  // List 

  list: {
    paddingBottom: 30
    ,
  },

  // Card 

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#7aa7b8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
  },

  cardLeft: {
    flex: 1,
    marginRight: 12,
  },

  cardRight: {
    alignItems: 'flex-end',
  },

  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  cardDate: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 4,
  },

  cardSubtitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },

  amountLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.8,
  },

  cardAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  // Status badge
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusPaid: {
    backgroundColor: '#1ca8b2',
  },

  statusPending: {
    backgroundColor: '#e05a5a',
  },

  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Filter / sort chips

  filterButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // States

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#ffffff',
  },

  errorText: {
    color: '#ff3232',
    marginBottom: 10,
    fontSize: 14,
  },

  retryButton: {
    backgroundColor: '#1ca8b2',
    padding: 12,
    borderRadius: 10,
  },

  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  emptyText: {
    color: '#ffffff',
    fontSize: 16,
  },

  // Modal

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: '#7aa7b8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
    maxHeight: '80%',
  },

  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },

  detailRow: {
    marginBottom: 12,
  },

  detailLabel: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.8,
  },

  detailValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  closeButton: {
    marginTop: 15,
    backgroundColor: '#1ca8b2',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
