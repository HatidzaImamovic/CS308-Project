import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#446977" },
  header: { padding: 24 },
  headerTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "#d8e3ea",
    fontSize: 16,
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  buttonCard: {
    backgroundColor: "#7aa7b8",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  buttonIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
    marginBottom: 14,
  },
  buttonTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  buttonSubtitle: {
    color: "#d8e3ea",
    fontSize: 13,
    lineHeight: 18,
  },
});
