import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { createUser } from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["menadžer", "serviser", "skladištar"];

const ROLE_COLORS = {
  "menadžer":   "#4EA8BE",
  "serviser":   "#5CB85C",
  "skladištar": "#E8A838",
};

const ROLE_LABELS = {
  "menadžer":   "Menadžer",
  "serviser":   "Serviser",
  "skladištar": "Skladištar",
};

// ─── Validation ───────────────────────────────────────────────────────────────
const ONLY_LETTERS = /^[A-Za-zÀ-žčćđšžČĆĐŠŽ\s'-]+$/;
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE  = /^[A-Za-z0-9._-]{3,30}$/;
const PASSWORD_MIN = 6;

const validateForm = (form) => {
  const errors = {};

  if (!form.fName.trim()) {
    errors.fName = "Ime je obavezno.";
  } else if (!ONLY_LETTERS.test(form.fName.trim())) {
    errors.fName = "Ime smije sadržavati samo slova.";
  }

  if (!form.lName.trim()) {
    errors.lName = "Prezime je obavezno.";
  } else if (!ONLY_LETTERS.test(form.lName.trim())) {
    errors.lName = "Prezime smije sadržavati samo slova.";
  }

  if (!form.username.trim()) {
    errors.username = "Korisničko ime je obavezno.";
  } else if (!USERNAME_RE.test(form.username.trim())) {
    errors.username = "3–30 znakova, samo slova, brojevi, '.', '-', '_'.";
  }

  if (!form.email.trim()) {
    errors.email = "Email je obavezan.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Neispravan format email adrese.";
  }

  if (!form.password) {
    errors.password = "Lozinka je obavezna.";
  } else if (form.password.length < PASSWORD_MIN) {
    errors.password = `Lozinka mora imati najmanje ${PASSWORD_MIN} znakova.`;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Potvrda lozinke je obavezna.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Lozinke se ne podudaraju.";
  }

  if (!form.role) {
    errors.role = "Uloga je obavezna.";
  }

  return errors;
};

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {!!error && <Text style={styles.fieldError}>{error}</Text>}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CreateUserScreen({ route, navigation }) {
  const { user } = route?.params || {};

  const EMPTY = {
    fName: "", lName: "", username: "",
    email: "", password: "", confirmPassword: "", role: "",
  };

  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field) => (val) => {
    setForm((f) => ({ ...f, [field]: val }));
    // clear error on change
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleCreate = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        fName:        form.fName.trim(),
        lName:        form.lName.trim(),
        username:     form.username.trim(),
        email:        form.email.trim().toLowerCase(),
        password:     form.password,
        role:         form.role,
      };

      await createUser(payload);

      Alert.alert(
        "Uspješno",
        `Korisnik "${form.fName.trim()} ${form.lName.trim()}" je kreiran.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("korisničko ime") || msg.toLowerCase().includes("username")) {
        setErrors((e) => ({ ...e, username: "Korisničko ime već postoji." }));
      } else if (msg.toLowerCase().includes("email")) {
        setErrors((e) => ({ ...e, email: "Email već postoji." }));
      } else {
        Alert.alert("Greška", msg || "Nije moguće kreirati korisnika.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#446977" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={styles.backBtnText}>← Natrag</Text>
        </TouchableOpacity>
        <View style={styles.headerIconBox}>
          <Image
            source={require("../public/centrometalLogo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Novi korisnik</Text>
            <Text style={styles.welcomeSubtitle}>
              Ispunite sve podatke za kreiranje novog korisnika
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>

            {/* Name row */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field label="Ime" error={errors.fName}>
                  <TextInput
                    style={[styles.input, !!errors.fName && styles.inputError]}
                    value={form.fName}
                    onChangeText={set("fName")}
                    placeholder="ime"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Prezime" error={errors.lName}>
                  <TextInput
                    style={[styles.input, !!errors.lName && styles.inputError]}
                    value={form.lName}
                    onChangeText={set("lName")}
                    placeholder="prezime"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Field>
              </View>
            </View>

            {/* Username */}
            <Field label="Korisničko ime" error={errors.username}>
              <TextInput
                style={[styles.input, !!errors.username && styles.inputError]}
                value={form.username}
                onChangeText={set("username")}
                placeholder="korisničko ime"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <TextInput
                style={[styles.input, !!errors.email && styles.inputError]}
                value={form.email}
                onChangeText={set("email")}
                placeholder="email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            {/* Password */}
            <Field label="Lozinka" error={errors.password}>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
                  value={form.password}
                  onChangeText={set("password")}
                  placeholder="min. 6 znakova"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.eyeText}>{showPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </Field>

            {/* Confirm password */}
            <Field label="Potvrdi lozinku" error={errors.confirmPassword}>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, !!errors.confirmPassword && styles.inputError]}
                  value={form.confirmPassword}
                  onChangeText={set("confirmPassword")}
                  placeholder="Ponovi lozinku"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.eyeText}>{showConfirm ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </Field>

            {/* Role */}
            <Field label="Uloga" error={errors.role}>
              <View style={styles.roleRow}>
                {ROLES.map((r) => {
                  const active = form.role === r;
                  const color  = ROLE_COLORS[r];
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleChip,
                        active && { backgroundColor: color + "33", borderColor: color },
                      ]}
                      onPress={() => set("role")(r)}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.roleChipText,
                        active && { color, fontWeight: "700" },
                      ]}>
                        {ROLE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>Kreiraj korisnika</Text>
            }
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>Odustani</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#446977" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#446977", paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#7aa7b8",
  },
  backBtn:     { paddingVertical: 4, paddingRight: 12 },
  backBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  headerIconBox: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: "#446977", alignItems: "center", justifyContent: "center",
  },
  logoImage: { width: 200, height: 100, resizeMode: "contain", marginRight: 115 },

  // Scroll
  scrollView:    { flex: 1, backgroundColor: "#446977" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Welcome
  welcomeSection:  { marginBottom: 24, marginTop: 8 },
  welcomeTitle:    { color: "#ffffff", fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  welcomeSubtitle: { color: "#ffffff", fontSize: 14, marginTop: 4 },

  // Form card
  formCard: {
    backgroundColor: "#7aa7b8", borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: "#ffffff", marginBottom: 16,
  },

  // Fields
  nameRow:      { flexDirection: "row" },
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: {
    color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6,
  },
  fieldError: { color: "#ffb3b3", fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: "#ffffff", fontSize: 14,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  inputError:    { borderColor: "#ffb3b3" },
  passwordRow:   { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1 },
  eyeBtn: {
    width: 42, height: 42, borderRadius: 10, marginLeft: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  eyeText: { fontSize: 16 },

  // Role chips
  roleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  roleChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  roleChipText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },

  // Buttons
  createBtn: {
    backgroundColor: "#446977", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#ffffff", marginBottom: 12,
  },
  createBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  cancelBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#ffffff",
    backgroundColor: "#7aa7b8",
  },
  cancelBtnText: { color: "#e05a5a", fontSize: 15, fontWeight: "600" },
});
