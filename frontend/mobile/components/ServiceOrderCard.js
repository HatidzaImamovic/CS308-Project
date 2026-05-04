import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const colors = {
  teal: '#079aa5',
  blue: '#176fb8',
  ink: '#12343b',
  line: '#d9eef1',
  white: '#ffffff',
};

const statusColors = {
  0: { bg: '#fff7dd', text: '#9a6a00', label: 'Na cekanju' },
  1: { bg: '#e7f2ff', text: colors.blue, label: 'U toku' },
  2: { bg: '#e3f8f5', text: '#057c77', label: 'Zavrsen' },
  3: { bg: '#ffe8e8', text: '#b42318', label: 'Otkazan' },
};

const typeLabels = {
  installation: 'Instalacija',
  maintenance: 'Odrzavanje',
  repair: 'Popravak',
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};

export default function ServiceOrderCard({ order, onPress }) {
  const status = statusColors[Number(order.status)] || statusColors[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <Text style={styles.orderId}>Nalog #{order.serviceOrderID}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.text }]}>
            {order.statusLabel || status.label}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {order.description || 'Nema opisa'}
      </Text>

      <View style={styles.metaGrid}>
        <Text style={styles.meta}>Tip: {typeLabels[order.type] || order.type || '-'}</Text>
        <Text style={styles.meta}>Uredaj: {order.serialNumber || '-'}</Text>
        <Text style={styles.meta}>Datum: {formatDate(order.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.teal,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: '800', color: colors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  description: { fontSize: 14, color: colors.ink, marginBottom: 12, lineHeight: 20 },
  metaGrid: { gap: 4 },
  meta: { fontSize: 12, color: '#557278', fontWeight: '600' },
});
