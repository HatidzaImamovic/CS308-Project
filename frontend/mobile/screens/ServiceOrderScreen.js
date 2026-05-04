import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl,
} from 'react-native';
import {
  getServiceOrders,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
} from '../services/api';
import ServiceOrderCard from '../components/ServiceOrderCard';

const colors = {
  teal: '#079aa5',
  blue: '#176fb8',
  ink: '#12343b',
  muted: '#5f7b80',
  pale: '#effbfc',
  line: '#d9eef1',
  white: '#ffffff',
  danger: '#c2414b',
};

const orderTypes = [
  { value: 'installation', label: 'Instalacija' },
  { value: 'maintenance', label: 'Odrzavanje' },
  { value: 'repair', label: 'Popravak' },
];

const statuses = [
  { value: 0, label: 'Na cekanju' },
  { value: 1, label: 'U toku' },
  { value: 2, label: 'Zavrsen' },
  { value: 3, label: 'Otkazan' },
];

const serialPattern = /^SN-\d{3,}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const emptyForm = () => ({
  type: 'repair',
  serialNumber: '',
  description: '',
  createdAt: new Date().toISOString().split('T')[0],
  status: 0,
});

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};

export default function ServiceOrderScreen({ route }) {
  const { user } = route.params;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getServiceOrders(user.userID);
      setOrders(data);
      setError('');
    } catch (err) {
      setError('Nije moguce ucitati servisne naloge.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.userID]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openCreate = () => {
    setEditingOrder(null);
    setForm(emptyForm());
    setFormVisible(true);
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const openEdit = (order) => {
    setDetailVisible(false);
    setEditingOrder(order);
    setForm({
      type: order.type || 'repair',
      serialNumber: order.serialNumber || '',
      description: order.description || '',
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : emptyForm().createdAt,
      status: Number(order.status || 0),
    });
    setFormVisible(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleSubmit = async () => {
    const serialNumber = form.serialNumber.trim().toUpperCase();
    if (!serialNumber) {
      Alert.alert('Validacija', 'Unesite serijski broj uredaja.');
      return;
    }
    if (!serialPattern.test(serialNumber)) {
      Alert.alert('Validacija', 'Serijski broj mora biti u formatu SN-001.');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Validacija', 'Unesite opis problema.');
      return;
    }
    if (!datePattern.test(form.createdAt)) {
      Alert.alert('Validacija', 'Datum mora biti u formatu YYYY-MM-DD.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        serialNumber,
        description: form.description.trim(),
        userID: user.userID,
      };

      if (editingOrder) {
        await updateServiceOrder(editingOrder.serviceOrderID, payload);
      } else {
        await createServiceOrder(payload);
      }

      setFormVisible(false);
      setEditingOrder(null);
      setForm(emptyForm());
      fetchOrders();
    } catch (err) {
      Alert.alert('Greska', 'Nalog nije sacuvan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await deleteServiceOrder(selectedOrder.serviceOrderID);
      setDetailVisible(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      Alert.alert('Greska', 'Nalog nije obrisan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.teal} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servisni nalozi</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={openCreate}>
          <Text style={styles.primaryButtonText}>+ Novi nalog</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.serviceOrderID)}
        renderItem={({ item }) => <ServiceOrderCard order={item} onPress={() => openDetail(item)} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.teal} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nema servisnih naloga.</Text>
            <Text style={styles.emptyHint}>Dodajte prvi nalog za uredaj.</Text>
          </View>
        }
      />

      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingOrder ? 'Uredi nalog' : 'Novi nalog'}</Text>
            <TouchableOpacity onPress={() => setFormVisible(false)}>
              <Text style={styles.modalClose}>X</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Tip naloga</Text>
          <View style={styles.segmentRow}>
            {orderTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.segment, form.type === type.value && styles.segmentActive]}
                onPress={() => setForm({ ...form, type: type.value })}
              >
                <Text style={[styles.segmentText, form.type === type.value && styles.segmentTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {editingOrder ? (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentRow}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[styles.segment, form.status === status.value && styles.segmentActive]}
                    onPress={() => setForm({ ...form, status: status.value })}
                  >
                    <Text style={[styles.segmentText, form.status === status.value && styles.segmentTextActive]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Serijski broj *</Text>
          <TextInput
            style={styles.input}
            placeholder="SN-00..."
            placeholderTextColor="#8aa5aa"
            value={form.serialNumber}
            onChangeText={(t) => setForm({ ...form, serialNumber: t.toUpperCase() })}
            autoCapitalize="characters"
          />
          <Text style={styles.helper}>Format: SN-001, SN-102, SN-00421</Text>

          <Text style={styles.label}>Opis problema *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Zamjena filtera, kvar, redovni servis..."
            placeholderTextColor="#8aa5aa"
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Datum</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8aa5aa"
            value={form.createdAt}
            onChangeText={(t) => setForm({ ...form, createdAt: t })}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.submitText}>{editingOrder ? 'Spremi izmjene' : 'Spremi nalog'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setFormVisible(false)}>
            <Text style={styles.secondaryButtonText}>Odustani</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nalog #{selectedOrder?.serviceOrderID}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailCard}>
              <DetailRow label="Status" value={selectedOrder?.statusLabel || statuses[Number(selectedOrder?.status || 0)]?.label} />
              <DetailRow label="Datum" value={formatDate(selectedOrder?.createdAt)} />
              <DetailRow label="Uredaj" value={selectedOrder?.serialNumber || '-'} />
              <DetailRow label="Tip" value={orderTypes.find((type) => type.value === selectedOrder?.type)?.label || selectedOrder?.type || '-'} />
              <DetailRow label="Opis" value={selectedOrder?.description || '-'} />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={() => openEdit(selectedOrder)}>
              <Text style={styles.submitText}>Uredi nalog</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleDelete} disabled={submitting}>
              <Text style={styles.dangerText}>Obrisi nalog</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pale },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  header: {
    backgroundColor: colors.white,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.teal, marginBottom: 14 },
  list: { padding: 16, paddingBottom: 28 },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '900', fontSize: 15 },
  errorBanner: { backgroundColor: '#fff1f1', color: colors.danger, padding: 10, textAlign: 'center', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 72 },
  emptyText: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyHint: { fontSize: 13, color: colors.muted, marginTop: 6 },
  modal: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.teal },
  modalClose: { fontSize: 16, color: colors.muted, padding: 8, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '900', color: colors.ink, marginBottom: 7 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    marginBottom: 8,
    color: colors.ink,
  },
  helper: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 16 },
  textarea: { height: 104, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  segment: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: colors.white,
  },
  segmentActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  segmentText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  segmentTextActive: { color: colors.white },
  submitBtn: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  secondaryButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  dangerButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerText: { color: colors.danger, fontSize: 15, fontWeight: '900' },
  detailCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.pale,
    marginBottom: 14,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingVertical: 9 },
  detailLabel: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  detailValue: { color: colors.ink, fontWeight: '900', fontSize: 13, flex: 1, textAlign: 'right' },
});
