import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { getFinancialRecords } from '../services/api';
import styles from './styles/financialScreen';

const PAYMENT_STATUS_LABELS = {
  1: 'Plaćeno',
  0: 'Na čekanju',
};

const SORT_OPTIONS = [
  { label: 'Datum ↑', field: 'createdAt', direction: 'asc' },
  { label: 'Datum ↓', field: 'createdAt', direction: 'desc' },
  { label: 'Iznos ↑', field: 'amount', direction: 'asc' },
  { label: 'Iznos ↓', field: 'amount', direction: 'desc' },
];

const FILTER_OPTIONS = [
  { label: 'Sve', value: null },
  { label: 'Plaćeno', value: 1 },
  { label: 'Na čekanju', value: 0 },
];

const SERVICE_TYPE_LABELS = {
  installation: 'Instalacija',
  repair: 'Popravak',
  maintenance: 'Odrzavanje',
};

export default function FinancialScreen({ route, navigation }) {
  const { user } = route.params;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0]);
  const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS[0]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFinancialRecords(user.userID);
      setRecords(data);
    } catch (err) {
      console.log('ERROR:', err);
      setError('Finansijski podaci se ne mogu učitati');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const getStatusLabel = (status) => PAYMENT_STATUS_LABELS[status] ?? 'Nepoznato';

  const getStatusStyle = (status) =>
    status === 1 ? styles.statusPaid : styles.statusPending;

  const getServiceTypeLabel = (type) =>
    SERVICE_TYPE_LABELS[type] || type || 'Nepoznat servis';

  const processedRecords = records
    .filter((r) => {
      if (activeFilter.value === null) return true;
      return Number(r.paymentStatus) === activeFilter.value;
    })
    .sort((a, b) => {
      const { field, direction } = activeSort;
      let valA = field === 'amount' ? parseFloat(a[field]) : new Date(a[field]);
      let valB = field === 'amount' ? parseFloat(b[field]) : new Date(b[field]);
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const renderRecord = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>
          {item.serviceOrderID
            ? `Servisni nalog #${item.serviceOrderID}`
            : 'Bez naloga'}
        </Text>
        <Text style={styles.cardSubtitle}>
          {getServiceTypeLabel(item.serviceType)}
        </Text>
        <Text style={styles.cardDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('bs-BA') : '—'}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.amountLabel}>Ukupno</Text>
        <Text style={styles.cardAmount}>
          {parseFloat(item.amount || 0).toFixed(2)} KM
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(Number(item.paymentStatus))]}>
          <Text style={styles.statusText}>{getStatusLabel(Number(item.paymentStatus))}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1ca8b2" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRecords}>
          <Text style={styles.retryText}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Nazad</Text>
      </TouchableOpacity>

      {/* Filter by status */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => setActiveFilter(option)}
            style={[
              styles.filterButton,
              activeFilter.value === option.value
                ? styles.statusPaid
                : styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRowLast}
        contentContainerStyle={styles.chipRowContent}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => setActiveSort(option)}
            style={[
              styles.filterButton,
              activeSort.label === option.label
                ? styles.statusPaid
                : styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
  {processedRecords.length === 0 ? (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>Nema finansijskih zapisa</Text>
    </View>
  ) : (
    <FlatList
      data={processedRecords}
      keyExtractor={(item, index) => item.recordID?.toString() || index.toString()}
      renderItem={renderRecord}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  )}
</View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalji zapisa</Text>
            {selectedRecord && (
              <ScrollView>
                <DetailRow
                  label="Nalog br."
                  value={selectedRecord.serviceOrderID ? `#${selectedRecord.serviceOrderID}` : '—'}
                />
                <DetailRow
                  label="Tip servisa"
                  value={getServiceTypeLabel(selectedRecord.serviceType)}
                />
                <DetailRow
                  label="Ukupno"
                  value={`${parseFloat(selectedRecord.amount || 0).toFixed(2)} KM`}
                />
                <DetailRow
                  label="Status"
                  value={getStatusLabel(Number(selectedRecord.paymentStatus))}
                />
                <DetailRow
                  label="Datum"
                  value={
                    selectedRecord.createdAt
                      ? new Date(selectedRecord.createdAt).toLocaleDateString('bs-BA')
                      : '—'
                  }
                />
                <DetailRow label="Opis" value={selectedRecord.description || '—'} />
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
