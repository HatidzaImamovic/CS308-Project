import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import styles, { COLORS } from '../styles/shopStyles';
import { addToCart } from '../../services/api';

export default function PartDetailScreen({ route, navigation }) {
  const { part, user } = route.params;
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    if (part.stock === 0) return;
    setAdding(true);
    try {
      await addToCart(user.userID, part.partID, 1);
      Alert.alert('Dodano u košaricu', `"${part.name}" je uspješno dodano.`, [
        { text: 'Nastavi kupovinu', onPress: () => navigation.goBack() },
        { text: 'Pogledaj košaricu', onPress: () => navigation.navigate('Cart', { user }) },
      ]);
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Detalji dijela</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={[styles.partName, { fontSize: 20, marginBottom: 6 }]}>{part.name}</Text>
          <Text style={[styles.totalVal, { marginBottom: 16 }]}>{Number(part.price).toFixed(2)} KM</Text>
          <Text style={styles.label}>Opis</Text>
          <Text style={{ color: COLORS.white, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
            {part.description || 'Nema opisa.'}
          </Text>
          <Text style={styles.label}>Na stanju</Text>
          <Text style={[styles.partName, part.stock === 0 && { color: COLORS.error }]}>
            {part.stock > 0 ? `${part.stock} kom` : 'Nema na stanju'}
          </Text>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.button, { marginBottom: 30 }, (part.stock === 0 || adding) && styles.buttonDisabled]}
        onPress={handleAddToCart}
        disabled={adding || part.stock === 0}
      >
        <Text style={styles.buttonText}>{adding ? 'Dodavanje...' : 'Dodaj u košaricu'}</Text>
      </TouchableOpacity>
    </View>
  );
}
