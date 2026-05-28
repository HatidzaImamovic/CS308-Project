import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles, { COLORS } from '../styles/shopStyles';
import { getOrderDetails } from '../../services/api';

const getDisplayOrderNumber = (order, fallbackOrderID) =>
  order?.orderNumber || fallbackOrderID;

export default function OrderConfirmScreen({ route, navigation }) {
  const { orderID, user } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBackToCatalogue = () => {
    navigation.dispatch(StackActions.popTo('Catalogue', { user }, { merge: true }));
  };

  useEffect(() => {
    getOrderDetails(orderID).then(setOrder).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.white} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <View style={localStyles.iconCircle}>
          <Text style={localStyles.checkmark}>✓</Text>
        </View>
        <Text style={[styles.topbarTitle, { fontSize: 22, marginBottom: 6 }]}>Narudžba poslana!</Text>
        <Text style={[styles.partStock, { marginBottom: 20, fontSize: 14 }]}>Skladište je primilo vašu narudžbu.</Text>

        <View style={[styles.card, { width: '100%', marginBottom: 12 }]}>
          <DetailRow label="Broj narudžbe" value={`#ORD-${String(getDisplayOrderNumber(order, orderID)).padStart(4, '0')}`} />
          <DetailRow label="Status" value="Na čekanju" valueColor={COLORS.success} />
          <DetailRow label="Datum" value={new Date(order.submittedAt).toLocaleDateString('bs-BA')} />
          <DetailRow label="Artikli" value={`${order.items.length} vrste, ${order.items.reduce((s, i) => s + i.quantity, 0)} kom`} />
          <DetailRow label="Ukupno" value={`${Number(order.total).toFixed(2)} KM`} last />
        </View>

        <View style={[styles.card, { width: '100%', marginBottom: 24 }]}>
          <Text style={[styles.label, { marginBottom: 10 }]}>Naručeni dijelovi</Text>
          {order.items.map((item) => (
            <View key={item.itemID} style={localStyles.itemRow}>
              <Text style={[styles.partName, { flex: 1, fontSize: 13 }]}>{item.name}</Text>
              <Text style={styles.partStock}>x{item.quantity}</Text>
              <Text style={[styles.partPrice, { marginLeft: 12 }]}>{(Number(item.unitPrice) * item.quantity).toFixed(2)} KM</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, { marginBottom: 12 }]} onPress={handleBackToCatalogue}>
          <Text style={styles.buttonText}>Nazad na katalog</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.outlineBtn} onPress={() => navigation.replace('OrderHistory', { user })}>
          <Text style={localStyles.outlineBtnText}>Pogledaj sve narudžbe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, valueColor, last }) {
  return (
    <View style={[localStyles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' }]}>
      <Text style={{ fontSize: 12, color: COLORS.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: valueColor || COLORS.white }}>{value}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(76,175,80,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 2, borderColor: '#4caf50' },
  checkmark: { fontSize: 30, color: '#4caf50' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  outlineBtn: { borderWidth: 2, borderColor: COLORS.white, borderRadius: 10, padding: 13, width: '70%', alignItems: 'center' },
  outlineBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
});
