import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles, { COLORS } from '../styles/shopStyles';
import { getUserOrders, cancelOrder } from '../../services/api';

const getDisplayOrderNumber = (order) =>
  order.orderNumber || order.sparePartsOrderID;

const STATUS = {
  pending:   { label: 'Na čekanju', color: COLORS.warning, bg: 'rgba(42,184,196,0.15)'  },
  completed: { label: 'Završeno',   color: COLORS.success, bg: 'rgba(61,186,122,0.15)'  },
};

export default function OrderHistoryScreen({ route, navigation }) {
  const { user } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders(user.userID);
      setOrders(data);
    } catch {
      Alert.alert('Greška', 'Nije moguće učitati narudžbe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (orderID) => {
    Alert.alert('Otkaži narudžbu', 'Da li ste sigurni?', [
      { text: 'Nazad', style: 'cancel' },
      { text: 'Otkaži', style: 'destructive', onPress: async () => {
        try { await cancelOrder(orderID); fetchOrders(); }
        catch (err) { Alert.alert('Greška', err.message); }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const s = STATUS[item.status] || { label: item.status, color: COLORS.muted, bg: 'rgba(255,255,255,0.1)' };
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.partName}>#ORD-{String(getDisplayOrderNumber(item)).padStart(4, '0')}</Text>
          <View style={[styles.pill, { backgroundColor: s.bg }]}>
            <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
        <Text style={styles.partStock}>
          {new Date(item.submittedAt).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.status === 'pending' && (
          <TouchableOpacity style={localStyles.cancelBtn} onPress={() => handleCancel(item.sparePartsOrderID)}>
            <Text style={localStyles.cancelText}>Otkaži narudžbu</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.white} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Moje narudžbe</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.sparePartsOrderID)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nemate prethodnih narudžbi.</Text>}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  cancelBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 10 },
  cancelText: { color: COLORS.error, fontSize: 13, fontWeight: 'bold' },
});
