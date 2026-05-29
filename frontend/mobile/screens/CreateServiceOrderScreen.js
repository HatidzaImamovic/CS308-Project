import React, { useState, useEffect, useMemo, useRef } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createServiceOrder,
  getSpareParts,
  updateServiceOrder,
} from "../services/api";
import styles from "./styles/createServiceOrderScreen";

const DRAFTS_STORAGE_KEY = (userId) => `SERVICE_ORDER_DRAFTS_${userId}`;

const SERVICE_TYPES = [
  { label: "Instalacija", value: "Instalacija" },
  { label: "Popravak", value: "Popravak" },
  { label: "Održavanje", value: "Održavanje" },
];

const SERVICE_PRICES = {
  Instalacija: 120,
  Popravak: 80,
  Održavanje: 60,
};

export default function CreateServiceOrderScreen({ route, navigation }) {
  const { user } = route?.params || {};

  const [formData, setFormData] = useState({
    serviceType: "",
    serialNumber: "",
    name: "",
    location: "",
    date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    spareParts: [],
  });
  const [draftId, setDraftId] = useState(null);
  const [editServerId, setEditServerId] = useState(null);
  const [errors, setErrors] = useState({});
  const [spareParts, setSpareParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const saveTimeout = useRef(null);
  const isEditingServerOrder = Boolean(editServerId);

  useEffect(() => {
    const draft = route?.params?.draft;
    if (draft) {
      // If this draft comes from a server order (we're editing a closed order),
      // avoid treating it as a local draft to prevent autosave/duplication.
      if (draft.isServer) {
        setEditServerId(draft.id);
        setDraftId(null);
      } else {
        setDraftId(String(draft.id));
      }
      setFormData({
        serviceType: draft.serviceType || "",
        serialNumber: draft.serialNumber || "",
        name: draft.name || "",
        location: draft.location || "",
        date: draft.date || new Date().toISOString().split("T")[0],
        spareParts: draft.spareParts || [],
      });
      // remove any stale local draft that might have the same id string
      (async () => {
        try {
          const userId = user?.id || user?.userID;
          if (userId && draft.isServer) {
            await removeDraft(userId, String(draft.id));
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [route?.params?.draft]);

  useEffect(() => {
    const loadSpareParts = async () => {
      try {
        setPartsLoading(true);
        const parts = await getSpareParts();
        setSpareParts(parts);
      } catch (error) {
        console.error("Error loading spare parts:", error);
      } finally {
        setPartsLoading(false);
      }
    };

    loadSpareParts();
  }, []);

  const servicePrice = SERVICE_PRICES[formData.serviceType] || 0;
  const selectedPartRows = useMemo(
    () =>
      formData.spareParts
        .map((selectedPart) => {
          const part = spareParts.find(
            (item) => Number(item.partID) === Number(selectedPart.partID),
          );

          if (!part) return null;

          return {
            ...part,
            quantity: Number(selectedPart.quantity),
          };
        })
        .filter(Boolean),
    [formData.spareParts, spareParts],
  );
  const partsTotal = selectedPartRows.reduce(
    (sum, part) => sum + Number(part.price) * part.quantity,
    0,
  );
  const orderTotal = servicePrice + partsTotal;

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

  const hasDraftData = () => {
    return Boolean(
      formData.serviceType ||
      formData.serialNumber ||
      formData.name ||
      formData.location,
    );
  };

  const saveDraftData = async (userId, currentFormData, currentDraftId) => {
    if (!userId || !hasDraftData()) return null;

    const draftKey = DRAFTS_STORAGE_KEY(userId);
    const draftJson = await AsyncStorage.getItem(draftKey);
    const existingDrafts = draftJson ? JSON.parse(draftJson) : [];
    const newDraftId = currentDraftId
      ? String(currentDraftId)
      : Date.now().toString();
    const newDraft = {
      id: String(newDraftId),
      ...currentFormData,
      userID: userId,
      isDraft: true,
      updatedAt: new Date().toISOString(),
      createdAt: currentDraftId
        ? currentFormData.createdAt || currentFormData.date
        : new Date().toISOString(),
    };
    const updatedDrafts = [
      newDraft,
      ...existingDrafts.filter(
        (draft) => String(draft.id) !== String(newDraftId),
      ),
    ];
    await AsyncStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
    setDraftId(String(newDraftId));
    return String(newDraftId);
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
          spareParts: formData.spareParts.filter(
            (part) => Number(part.quantity) > 0,
          ),
          userID: userId,
          status: 1,
        };

        if (editServerId) {
          // update existing server order
          await updateServiceOrder(editServerId, {
            serviceType: orderData.serviceType,
            serialNumber: orderData.serialNumber,
            name: orderData.name,
            location: orderData.location,
            date: orderData.date,
            spareParts: orderData.spareParts,
          });
        } else {
          console.log("Creating service order", orderData);
          await createServiceOrder(orderData);

          if (draftId) {
            await removeDraft(userId, draftId);
          }
        }

        Alert.alert(
          "Uspjeh",
          isEditingServerOrder
            ? "Servisni nalog je uspješno ažuriran!"
            : "Servisni nalog je uspješno kreiran!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ],
        );
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

  const updatePartQuantity = (partID, nextQuantity) => {
    const quantity = Math.max(0, Number(nextQuantity) || 0);

    setFormData((prev) => {
      const currentParts = prev.spareParts || [];
      const existingPart = currentParts.find(
        (part) => Number(part.partID) === Number(partID),
      );

      if (quantity === 0) {
        return {
          ...prev,
          spareParts: currentParts.filter(
            (part) => Number(part.partID) !== Number(partID),
          ),
        };
      }

      if (existingPart) {
        return {
          ...prev,
          spareParts: currentParts.map((part) =>
            Number(part.partID) === Number(partID)
              ? { ...part, quantity }
              : part,
          ),
        };
      }

      return {
        ...prev,
        spareParts: [...currentParts, { partID, quantity }],
      };
    });
  };

  const getPartQuantity = (partID) => {
    const selectedPart = formData.spareParts.find(
      (part) => Number(part.partID) === Number(partID),
    );

    return selectedPart ? Number(selectedPart.quantity) : 0;
  };

  const removeDraft = async (userId, id) => {
    try {
      const draftJson = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY(userId));
      const drafts = draftJson ? JSON.parse(draftJson) : [];
      const updatedDrafts = drafts.filter(
        (draft) => String(draft.id) !== String(id),
      );
      await AsyncStorage.setItem(
        DRAFTS_STORAGE_KEY(userId),
        JSON.stringify(updatedDrafts),
      );
    } catch (err) {
      console.error("Error removing draft:", err);
    }
  };

  const saveDraft = async () => {
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
      const savedId = await saveDraftData(userId, formData, draftId);
      if (savedId) {
        Alert.alert(
          "Nacrt spremljen",
          "Servisni nalog je spremljen kao otvoreni nalog.",
        );
      } else {
        Alert.alert(
          "Nema podataka",
          "Nema dovoljno podataka za spremanje nacrta.",
        );
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      Alert.alert("Greška", "Nije moguće spremiti nacrt. Pokušajte ponovo.", [
        { text: "OK" },
      ]);
    }
  };

  useEffect(() => {
    const userId = user?.id || user?.userID;
    if (!userId) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    // Don't autosave when editing a server order (we don't want to create a local draft)
    if (!editServerId) {
      saveTimeout.current = setTimeout(() => {
        saveDraftData(userId, formData, draftId).catch((err) => {
          console.error("Error autosaving draft:", err);
        });
      }, 800);
    }

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [formData, draftId, user?.id, user?.userID]);

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
        <Text style={styles.headerTitle}>
          {isEditingServerOrder ? "Uredi servisni nalog" : "Novi servisni nalog"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formCard}>
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

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cijena servisa</Text>
              <Text style={styles.summaryValue}>
                {servicePrice.toFixed(2)} KM
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rezervni dijelovi</Text>
            <Text style={styles.helperText}>
              Ostavite kolicinu 0 ako nisu koristeni rezervni dijelovi.
            </Text>

            {partsLoading ? (
              <Text style={styles.helperText}>Ucitavanje dijelova...</Text>
            ) : spareParts.length === 0 ? (
              <Text style={styles.helperText}>Nema dostupnih dijelova.</Text>
            ) : (
              spareParts.map((part) => {
                const quantity = getPartQuantity(part.partID);
                const lineTotal = Number(part.price) * quantity;

                return (
                  <View key={part.partID} style={styles.partRow}>
                    <View style={styles.partInfo}>
                      <Text style={styles.partName}>{part.name}</Text>
                      <Text style={styles.partMeta}>
                        {Number(part.price).toFixed(2)} KM / kom
                      </Text>
                      <Text style={styles.partMeta}>Na stanju: {part.stock}</Text>
                    </View>

                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updatePartQuantity(part.partID, quantity - 1)
                        }
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.quantityInput}
                        value={String(quantity)}
                        onChangeText={(value) =>
                          updatePartQuantity(part.partID, value)
                        }
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updatePartQuantity(part.partID, quantity + 1)
                        }
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                      <Text style={styles.partTotal}>
                        {lineTotal.toFixed(2)} KM
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.totalBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dijelovi</Text>
              <Text style={styles.summaryValue}>
                {partsTotal.toFixed(2)} KM
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Ukupno</Text>
              <Text style={styles.totalValue}>{orderTotal.toFixed(2)} KM</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {isEditingServerOrder ? "Azuriraj nalog" : "Kreiraj nalog"}
            </Text>
          </TouchableOpacity>
        </View>
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
