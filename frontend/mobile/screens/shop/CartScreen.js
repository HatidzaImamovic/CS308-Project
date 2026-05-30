import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCart,
  removeFromCart,
  submitOrder,
  updateCartItem,
} from '../../services/api';
import styles, { COLORS } from '../styles/shopStyles';

export default function CartScreen({ route, navigation }) {
  const { user } = route.params;
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingItemID, setUpdatingItemID] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, []),
  );

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart(user.userID);
      setCart(data);
    } catch (err) {
      Alert.alert('Greška', 'Nije moguće učitati korpu.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (cartItemID, currentQty, delta) => {
    if (updatingItemID) return;

    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemove(cartItemID);
      return;
    }

    setUpdatingItemID(cartItemID);
    try {
      await updateCartItem(cartItemID, newQty);
      await fetchCart();
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally {
      setUpdatingItemID(null);
    }
  };

  const handleRemove = (cartItemID) => {
    Alert.alert('Ukloni stavku', 'Da li ste sigurni?', [
      { text: 'Odustani', style: 'cancel' },
      {
        text: 'Ukloni',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFromCart(cartItemID);
            fetchCart();
          } catch {
            Alert.alert('Greška', 'Nije moguće ukloniti stavku.');
          }
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    Alert.alert(
      'Potvrdi narudzbu',
      `Ukupno: ${Number(cart.total).toFixed(2)} KM\n\nDa li želite naručiti?`,
      [
        { text: 'Odustani', style: 'cancel' },
        { text: 'Naruči', onPress: submitCheckout },
      ],
    );
  };

  const submitCheckout = async () => {
    setSubmitting(true);
    try {
      const result = await submitOrder(user.userID);
      navigation.replace('OrderConfirm', { orderID: result.orderID, user });
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUpdating = updatingItemID === item.cartItemID;

    return (
      <View style={localStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.partName}>{item.name}</Text>
          <Text style={styles.partStock}>
            {Number(item.price).toFixed(2)} KM / kom
          </Text>
        </View>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            style={[styles.qtyBtn, isUpdating && styles.qtyBtnDisabled]}
            onPress={() => handleUpdateQty(item.cartItemID, item.quantity, -1)}
            disabled={isUpdating}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, isUpdating && styles.qtyBtnDisabled]}
            onPress={() => handleUpdateQty(item.cartItemID, item.quantity, 1)}
            disabled={isUpdating}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.partPrice, { minWidth: 70, textAlign: 'right' }]}>
          {(Number(item.price) * item.quantity).toFixed(2)} KM
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Korpa</Text>
        <View style={{ width: 44 }} />
      </View>

      {cart.items.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyText}>Korpa je prazna.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.emptyActionText}>Idi na katalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => String(item.cartItemID)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 6, paddingBottom: 12 }}
          />
          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Ukupno ({cart.items.reduce((s, i) => s + i.quantity, 0)} kom)
              </Text>
              <Text style={styles.totalVal}>
                {Number(cart.total).toFixed(2)} KM
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.button,
                styles.checkoutButton,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Slanje...' : 'Naruči dijelove'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
});
