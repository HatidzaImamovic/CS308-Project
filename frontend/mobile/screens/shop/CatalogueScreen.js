import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { addToCart, getParts } from '../../services/api';
import styles, { COLORS } from '../styles/shopStyles';

export default function CatalogueScreen({ route, navigation }) {
  const { user } = route.params;
  const [parts, setParts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingID, setAddingID] = useState(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const data = await getParts();
      setParts(data);
      setFiltered(data);
    } catch (err) {
      Alert.alert('Greška', 'Nije moguće učitati katalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    setFiltered(
      !text
        ? parts
        : parts.filter((part) =>
            part.name.toLowerCase().includes(text.toLowerCase()),
          ),
    );
  };

  const handleAddToCart = async (part) => {
    if (part.stock === 0) {
      Alert.alert('Nema na stanju', 'Ovaj dio trenutno nije dostupan.');
      return;
    }

    setAddingID(part.partID);
    try {
      await addToCart(user.userID, part.partID, 1);
      Alert.alert('Dodano', `"${part.name}" dodano u korpu.`);
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally {
      setAddingID(null);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={localStyles.row}
      onPress={() => navigation.navigate('PartDetail', { part: item, user })}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.partName}>{item.name}</Text>
        <Text style={[styles.partStock, item.stock === 0 && { color: COLORS.error }]}>
          {item.stock > 0 ? `Na stanju: ${item.stock} kom` : 'Nema na stanju'}
        </Text>
      </View>
      <Text style={styles.partPrice}>{Number(item.price).toFixed(2)} KM</Text>
      <TouchableOpacity
        style={[styles.addButton, item.stock === 0 && styles.addButtonDisabled]}
        onPress={() => handleAddToCart(item)}
        disabled={addingID === item.partID || item.stock === 0}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={styles.topbarTitle}>Katalog dijelova</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('OrderHistory', { user })}
          >
            <Text style={styles.headerIconText}>≡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart', { user })}
          >
            <Text style={styles.cartButtonText}>Korpa</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Pretraži dijelove..."
        placeholderTextColor={COLORS.muted}
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.partID)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nema rezultata za "{search}"</Text>}
      />
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
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
});
