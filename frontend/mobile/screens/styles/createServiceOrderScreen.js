import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#446977",
  },
  header: {
    backgroundColor: "#446977",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#446977",
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#446977",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe5eb",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#f5f8fb",
    color: "#2f4a57",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#dbe5eb",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: "#f5f8fb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#2f4a57",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#dc3545",
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#1ca8b2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: width * 0.8,
    maxHeight: height * 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCancel: {
    padding: 15,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#dc3545",
    fontWeight: "600",
  },
});
