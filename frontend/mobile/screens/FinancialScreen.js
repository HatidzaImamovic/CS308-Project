import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFinancialRecords } from "../services/api";
import styles from "./styles/financialScreen";

const SORT_OPTIONS = [
  { label: "Najnovije", field: "createdAt", direction: "desc" },
  { label: "Najstarije", field: "createdAt", direction: "asc" },
  { label: "Najmanji iznos", field: "amount", direction: "asc" },
  { label: "Najveci iznos", field: "amount", direction: "desc" },
];

const SERVICE_TYPE_LABELS = {
  installation: "Instalacija",
  repair: "Popravak",
  maintenance: "Odrzavanje",
};

const getDisplayOrderNumber = (record) =>
  record.serviceOrderNumber || record.orderNumber || record.serviceOrderID;

export default function FinancialScreen({ route, navigation }) {
  const { user } = route.params;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getFinancialRecords(user.userID);
      setRecords(data);
    } catch (err) {
      console.log("ERROR:", err);
      setError("Finansijski podaci se ne mogu ucitati");
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeLabel = (type) =>
    SERVICE_TYPE_LABELS[type] || type || "Nepoznat servis";

  const processedRecords = records.sort((a, b) => {
    const { field, direction } = activeSort;
    const valA =
      field === "amount" ? parseFloat(a[field]) : new Date(a[field]);
    const valB =
      field === "amount" ? parseFloat(b[field]) : new Date(b[field]);

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const openDetail = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const renderRecord = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.serviceOrderID ? `Servisni nalog #${getDisplayOrderNumber(item)}` : "Bez naloga"}
        </Text>
      </View>

      <Text style={styles.cardSubtitle}>
        {getServiceTypeLabel(item.serviceType)}
      </Text>
      <Text style={styles.cardDate}>
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("bs-BA")
          : "-"}
      </Text>
      <Text style={styles.cardAmount}>
        {parseFloat(item.amount || 0).toFixed(2)} KM
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1ca8b2" />
        <Text style={styles.loadingText}>Ucitavanje...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRecords}>
          <Text style={styles.retryText}>Pokusaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finansijski zapisi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => setActiveSort(option)}
              style={[
                styles.filterChip,
                activeSort.label === option.label && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeSort.label === option.label &&
                    styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {processedRecords.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nema finansijskih zapisa</Text>
          </View>
        ) : (
          <FlatList
            data={processedRecords}
            keyExtractor={(item, index) =>
              item.recordID?.toString() || index.toString()
            }
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
                  value={
                    selectedRecord.serviceOrderID
                      ? `#${getDisplayOrderNumber(selectedRecord)}`
                      : "-"
                  }
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
                  label="Datum"
                  value={
                    selectedRecord.createdAt
                      ? new Date(selectedRecord.createdAt).toLocaleDateString(
                          "bs-BA",
                        )
                      : "-"
                  }
                />
                <DetailRow
                  label="Opis"
                  value={selectedRecord.description || "-"}
                />
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
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
