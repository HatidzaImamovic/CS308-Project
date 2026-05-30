import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
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

  if (loading) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ActivityIndicator size="large" color={COLORS.white} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 32, alignItems: 'center' }}>
        <View style={localStyles.iconCircle}>
          <Text style={localStyles.checkmark}>✓</Text>
        </View>
        <Text style={[styles.topbarTitle, { fontSize: 22, marginBottom: 6 }]}>Narudžba poslana!</Text>
        <Text style={[styles.partStock, { marginBottom: 20, fontSize: 14 }]}>Skladište je primilo vašu narudžbu.</Text>

        <View style={[styles.card, { width: '100%', marginBottom: 12 }]}>
          <DetailRow label="Broj narudžbe" value={`#ORD-${String(getDisplayOrderNumber(order, orderID)).padStart(4, '0')}`} />
          <DetailRow label="Status" value="Na čekanju" valueColor={COLORS.warning} />
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
    </SafeAreaView>
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
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(61,186,122,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 2, borderColor: COLORS.success },
  checkmark: { fontSize: 32, color: COLORS.success },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  outlineBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: 13, width: '70%', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  outlineBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
});
