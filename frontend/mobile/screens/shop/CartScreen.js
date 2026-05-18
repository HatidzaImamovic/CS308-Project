import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles, { COLORS } from '../styles/shopStyles';
import { getCart, updateCartItem, removeFromCart, submitOrder } from '../../services/api';

export default function CartScreen({ route, navigation }) {
  const { user } = route.params;
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart(user.userID);
      setCart(data);
    } catch (err) {
      Alert.alert('Greška', 'Nije moguće učitati košaricu.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (cartItemID, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) { handleRemove(cartItemID); return; }
    try {
      await updateCartItem(cartItemID, newQty);
      fetchCart();
    } catch (err) { Alert.alert('Greška', err.message); }
  };

  const handleRemove = (cartItemID) => {
    Alert.alert('Ukloni stavku', 'Da li ste sigurni?', [
      { text: 'Odustani', style: 'cancel' },
      { text: 'Ukloni', style: 'destructive', onPress: async () => {
        try { await removeFromCart(cartItemID); fetchCart(); }
        catch { Alert.alert('Greška', 'Nije moguće ukloniti stavku.'); }
      }}
    ]);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    Alert.alert('Potvrdi narudžbu', `Ukupno: ${Number(cart.total).toFixed(2)} KM\n\nDa li želite naručiti?`, [
      { text: 'Odustani', style: 'cancel' },
      { text: 'Naruči', onPress: submitCheckout }
    ]);
  };

  const submitCheckout = async () => {
    setSubmitting(true);
    try {
      const result = await submitOrder(user.userID);
      navigation.replace('OrderConfirm', { orderID: result.orderID, user });
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally { setSubmitting(false); }
  };

  const renderItem = ({ item }) => (
    <View style={localStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.partName}>{item.name}</Text>
        <Text style={styles.partStock}>{Number(item.price).toFixed(2)} KM / kom</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.cartItemID, item.quantity, -1)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyNum}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.cartItemID, item.quantity, +1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.partPrice, { minWidth: 70, textAlign: 'right' }]}>
        {(Number(item.price) * item.quantity).toFixed(2)} KM
      </Text>
    </View>
  );

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.white} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Nazad</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Košarica</Text>
        <View style={{ width: 60 }} />
      </View>
      {cart.items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Text style={styles.emptyText}>Košarica je prazna.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Idi na katalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => String(item.cartItemID)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ukupno ({cart.items.reduce((s, i) => s + i.quantity, 0)} kom)</Text>
            <Text style={styles.totalVal}>{Number(cart.total).toFixed(2)} KM</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { marginBottom: 30 }, submitting && styles.buttonDisabled]}
            onPress={handleCheckout}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Slanje...' : 'Naruči dijelove'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
});