import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { createServiceOrder } from "../services/api";
import styles from "./styles/createServiceOrderScreen";

const SERVICE_TYPES = [
  { label: "Instalacija", value: "Instalacija" },
  { label: "Popravak", value: "Popravak" },
  { label: "Održavanje", value: "Održavanje" },
];

export default function CreateServiceOrderScreen({ route, navigation }) {
  const { user } = route?.params || {};

  const [formData, setFormData] = useState({
    serviceType: "",
    serialNumber: "",
    name: "",
    location: "",
    date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
  });

  const [errors, setErrors] = useState({});
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Service type validation
    if (!formData.serviceType) {
      newErrors.serviceType = "Molimo odaberite tip servisa";
    }

    // Serial number validation (SN-000 format)
    const serialRegex = /^SN-\d{3}$/;
    if (!formData.serialNumber) {
      newErrors.serialNumber = "Serijski broj je obavezan";
    } else if (!serialRegex.test(formData.serialNumber)) {
      newErrors.serialNumber = "Format mora biti SN-000 (npr. SN-001)";
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Ime je obavezno";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Ime mora imati najmanje 2 znaka";
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = "Lokacija je obavezna";
    } else if (formData.location.trim().length < 2) {
      newErrors.location = "Lokacija mora imati najmanje 2 znaka";
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "Datum je obavezan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const userId = user?.id || user?.userID;
      if (!userId) {
        Alert.alert(
          "Greška",
          "Korisnik nije prepoznat. Molimo prijavite se ponovo.",
          [{ text: "OK" }],
        );
        return;
      }

      try {
        const orderData = {
          ...formData,
          userID: userId,
        };

        console.log("Creating service order", orderData);
        const result = await createServiceOrder(orderData);

        Alert.alert("Uspjeh", "Servisni nalog je uspješno kreiran!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } catch (error) {
        console.error("Error creating service order:", error);
        Alert.alert(
          "Greška",
          error.message ||
            "Došlo je do greške prilikom kreiranja servisnog naloga. Pokušajte ponovo.",
          [{ text: "OK" }],
        );
      }
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const selectServiceType = (type) => {
    updateFormData("serviceType", type);
    setShowServiceTypeModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novi servisni nalog</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Type Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tip servisa *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.serviceType && styles.inputError]}
            onPress={() => setShowServiceTypeModal(true)}
          >
            <Text
              style={
                formData.serviceType
                  ? styles.dropdownText
                  : styles.placeholderText
              }
            >
              {formData.serviceType || "Odaberite tip servisa"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {errors.serviceType && (
            <Text style={styles.errorText}>{errors.serviceType}</Text>
          )}
        </View>

        {/* Serial Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Serijski broj *</Text>
          <TextInput
            style={[styles.input, errors.serialNumber && styles.inputError]}
            value={formData.serialNumber}
            onChangeText={(value) => updateFormData("serialNumber", value)}
            placeholder="SN-000"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
          {errors.serialNumber && (
            <Text style={styles.errorText}>{errors.serialNumber}</Text>
          )}
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ime *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateFormData("name", value)}
            placeholder="Unesite ime"
            placeholderTextColor="#999"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lokacija *</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            value={formData.location}
            onChangeText={(value) => updateFormData("location", value)}
            placeholder="Unesite lokaciju"
            placeholderTextColor="#999"
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Datum *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={formData.date}
            onChangeText={(value) => updateFormData("date", value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Kreiraj nalog</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Service Type Modal */}
      <Modal
        visible={showServiceTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Odaberite tip servisa</Text>
            <FlatList
              data={SERVICE_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => selectServiceType(item.value)}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowServiceTypeModal(false)}
            >
              <Text style={styles.modalCancelText}>Odustani</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
