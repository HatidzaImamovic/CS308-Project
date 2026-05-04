import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const colors = {
  teal: '#079aa5',
  blue: '#176fb8',
  ink: '#12343b',
  muted: '#5f7b80',
  pale: '#effbfc',
  line: '#d9eef1',
  white: '#ffffff',
};

const modules = [
  {
    key: 'ServiceOrders',
    label: 'Servisni nalozi',
    description: 'Pregled, unos i uredjivanje servisnih naloga',
    color: colors.blue,
    bg: colors.white,
  },
  {
    key: 'SpareParts',
    label: 'Rezervni dijelovi',
    description: 'Narudzbe i stanje rezervnih dijelova',
    color: colors.teal,
    bg: colors.white,
  },
  {
    key: 'Financial',
    label: 'Finansijski zapisi',
    description: 'Fakture, placanja i pregledi',
    color: colors.ink,
    bg: colors.white,
  },
];

export default function HomeScreen({ route, navigation }) {
  const { user } = route.params;
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>Centrometal</Text>
        <Text style={styles.welcome}>Dobrodosli, {user.fName}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Odjavi se</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Moduli</Text>

      {modules.map((mod) => (
        <TouchableOpacity
          key={mod.key}
          style={[styles.card, { backgroundColor: mod.bg, borderLeftColor: mod.color }]}
          onPress={() => navigation.navigate(mod.key, { user })}
        >
          <Text style={[styles.cardTitle, { color: mod.color }]}>{mod.label}</Text>
          <Text style={styles.cardDesc}>{mod.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pale },
  content: { padding: 20 },
  header: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  brand: { fontSize: 28, fontWeight: '900', color: colors.teal, marginBottom: 8 },
  welcome: { fontSize: 20, fontWeight: '900', color: colors.ink },
  logoutButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  logoutText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', marginBottom: 12 },
  card: {
    borderRadius: 8,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.muted, fontWeight: '600' },
});
