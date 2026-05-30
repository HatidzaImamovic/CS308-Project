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
import { COLORS } from "./styles/loginScreen";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["menadžer", "serviser", "skladištar"];

const ROLE_COLORS = {
  "menadžer":   COLORS.accent,
  "serviser":   COLORS.success,
  "skladištar": COLORS.muted,
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

  // Password handlers: when hidden, reconcile bullet input against stored value
  const handlePasswordChange = (field, currentValue, showField) => (newText) => {
    if (showField) {
      // Visible — just use value directly
      set(field)(newText);
      return;
    }
    // Hidden — bullets were displayed; figure out what changed
    const oldLen = currentValue.length;
    const newLen = newText.length;
    if (newLen > oldLen) {
      // Characters added — append the new non-bullet chars
      const added = newText.slice(oldLen).replace(/•/g, "");
      set(field)(currentValue + added);
    } else {
      // Characters deleted
      set(field)(currentValue.slice(0, newLen));
    }
  };

  const isDirty = Object.values(form).some((v) => v.trim?.() !== "" || v !== "");

  const handleBack = () => {
    const dirty = Object.keys(EMPTY).some((k) => form[k] !== EMPTY[k]);
    if (!dirty) { navigation.goBack(); return; }
    Alert.alert(
      "Odustani od kreiranja?",
      "Uneseni podaci će biti izgubljeni.",
      [
        { text: "Ostani", style: "cancel" },
        { text: "Napusti", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
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
                  value={showPass ? form.password : form.password.replace(/./g, "•")}
                  onChangeText={handlePasswordChange("password", form.password, showPass)}
                  placeholder="min. 6 znakova"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  keyboardType={showPass ? "default" : "default"}
                  caretHidden={!showPass}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.eyeText}>{showPass ? "Sakrij" : "Prikaži"}</Text>
                </TouchableOpacity>
              </View>
            </Field>

            {/* Confirm password */}
            <Field label="Potvrdi lozinku" error={errors.confirmPassword}>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, !!errors.confirmPassword && styles.inputError]}
                  value={showConfirm ? form.confirmPassword : form.confirmPassword.replace(/./g, "•")}
                  onChangeText={handlePasswordChange("confirmPassword", form.confirmPassword, showConfirm)}
                  placeholder="Ponovi lozinku"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  caretHidden={!showConfirm}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.eyeText}>{showConfirm ? "Sakrij" : "Prikaži"}</Text>
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


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.panel,
  },
  backBtn:     { paddingVertical: 4, paddingRight: 12 },
  backBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  headerIconBox: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center",
  },
  logoImage: { width: 200, height: 100, resizeMode: "contain", marginRight: 115 },

  // Scroll
  scrollView:    { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Welcome
  welcomeSection:  { marginBottom: 24, marginTop: 8 },
  welcomeTitle:    { color: COLORS.white, fontSize: 24, fontWeight: "700", letterSpacing: 0.2 },
  welcomeSubtitle: { color: COLORS.white, fontSize: 14, marginTop: 4 },

  // Form card
  formCard: {
    backgroundColor: COLORS.panel, borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: COLORS.white, marginBottom: 16,
  },

  // Fields
  nameRow:      { flexDirection: "row" },
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: {
    color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6,
  },
  fieldError: { color: "rgba(224,90,90,0.6)", fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: COLORS.white, fontSize: 14,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  inputError:    { borderColor: "rgba(224,90,90,0.6)" },
  passwordRow:   { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1 },
  eyeBtn: {
    height: 42, borderRadius: 10, marginLeft: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  eyeText: { fontSize: 13, color: COLORS.white, fontWeight: "600" },

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
    backgroundColor: COLORS.bg, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.white, marginBottom: 12,
  },
  createBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },

});