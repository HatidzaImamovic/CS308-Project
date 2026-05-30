import { StyleSheet } from "react-native";

export const COLORS = {
  bg:      "#1a3a3f",
  panel:   "#1e5c6b",
  accent:  "#2ab8c4",
  white:   "#f0f4f6",
  muted:   "#8fb3bf",
  success: "#3dba7a",
  warning: "#2ab8c4",
  danger:  "#e05a5a",
};

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: COLORS.bg,
  },
  logo: {
    width: 300,
    height: 100,
    marginBottom: 50,
    alignSelf: "center",
    resizeMode: "contain",
    marginTop: -100,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 15,
    marginBottom: 15,
    borderRadius: 14,
    color: COLORS.white,
    backgroundColor: COLORS.panel,
    fontSize: 14,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 10,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    width: "70%",
    alignSelf: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },
});
