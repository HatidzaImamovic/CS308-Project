import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

const API_URL = config.API_URL;
const AUTH_TOKEN_KEY = "CS308_PROJECT_AUTH_TOKEN";
const USER_SESSION_KEY = "CS308_PROJECT_USER_SESSION";
const DRAFTS_PREFIX = "SERVICE_ORDER_DRAFTS_";

export const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveAuthToken = async (token) => {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.warn("Failed to save auth token", err);
  }
};

export const clearAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn("Failed to clear auth token", err);
  }
};

export const saveUserSession = async (user) => {
  try {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn("Failed to save user session", err);
  }
};

export const getUserSession = async () => {
  try {
    const value = await SecureStore.getItemAsync(USER_SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const clearUserSession = async () => {
  try {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
  } catch (err) {
    console.warn("Failed to clear user session", err);
  }
};

const getDraftsStorageKey = (userId) => `${DRAFTS_PREFIX}${userId}`;

export const getDrafts = async (userId) => {
  try {
    const key = getDraftsStorageKey(userId);
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue) {
      return JSON.parse(secureValue);
    }

    const legacy = await AsyncStorage.getItem(key);
    if (legacy) {
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
      return JSON.parse(legacy);
    }
  } catch (err) {
    console.warn("Failed to load drafts", err);
  }
  return [];
};

export const saveDrafts = async (userId, drafts) => {
  try {
    const key = getDraftsStorageKey(userId);
    await SecureStore.setItemAsync(key, JSON.stringify(drafts));
  } catch (err) {
    console.warn("Failed to save drafts", err);
  }
};

export const removeDraftById = async (userId, draftId) => {
  try {
    const drafts = await getDrafts(userId);
    const remaining = drafts.filter((draft) => String(draft.id) !== String(draftId));
    await saveDrafts(userId, remaining);
  } catch (err) {
    console.warn("Failed to remove draft", err);
  }
};

// ─── HELPER ────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "Request failed");
  return data;
};

// ─── SERVICE ORDERS ────────────────────────────────────────
export const getSpareParts = () => request("/spareparts");
export const getAllServiceOrders = () => request("/serviceorders");
export const getServiceOrders = (userID) => request(`/serviceorders/${userID}`);
export const createServiceOrder = (orderData) => request("/serviceorders", { method: "POST", body: JSON.stringify(orderData) });
export const updateServiceOrderStatus = (orderId, status) => request(`/serviceorders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
export const updateServiceOrder = (orderId, data) => request(`/serviceorders/${orderId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteServiceOrder = (orderId) => request(`/serviceorders/${orderId}`, { method: "DELETE" });
export const deleteAllServiceOrders = (userId) => request(`/serviceorders/user/${userId}`, { method: "DELETE" });

// ─── FINANCIAL ─────────────────────────────────────────────
export const getFinancialRecords = (userID) => request(`/financial/${userID}`);

// ─── AUTH ──────────────────────────────────────────────────
export const login = (username, password) => request("/login", { method: "POST", body: JSON.stringify({ username, password }) });
export const logout = async () => {
  await clearAuthToken();
  await clearUserSession();
};

// ─── SHOP ──────────────────────────────────────────────────
export const getParts = () => request("/spareparts");
export const getCart = (userID) => request(`/api/cart/${userID}`);
export const addToCart = (userID, partID, quantity = 1) => request(`/api/cart/${userID}/items`, { method: "POST", body: JSON.stringify({ partID, quantity }) });
export const updateCartItem = (cartItemID, quantity) => request(`/api/cart/items/${cartItemID}`, { method: "PUT", body: JSON.stringify({ quantity }) });
export const removeFromCart = (cartItemID) => request(`/api/cart/items/${cartItemID}`, { method: "DELETE" });
export const submitOrder = (userID) => request("/api/orders", { method: "POST", body: JSON.stringify({ userID }) });
export const getUserOrders = (userID) => request(`/api/orders/user/${userID}`);
export const getOrderDetails = (orderID) => request(`/api/orders/${orderID}`);
export const cancelOrder = (orderID) => request(`/api/orders/${orderID}/cancel`, { method: "PATCH" });

// ─── WAREHOUSE ─────────────────────────────────────────────
export const getWarehouseOrders = () => request("/api/warehouse/orders");
export const fulfillWarehouseOrder = (orderID) => request(`/api/warehouse/orders/${orderID}/fulfill`, { method: "PATCH" });

// ─── USERS ─────────────────────────────────────────────────
export const getUsers = () => request("/users");
export const updateUser = (userId, payload) => request(`/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteUser = (userId) => request(`/users/${userId}`, { method: "DELETE" });
export const createUser = (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) });

// ─── PARTS ─────────────────────────────────────────────────
export const createPart = (payload) => request("/spareparts", { method: "POST", body: JSON.stringify(payload) });
export const updatePart = (partID, payload) => request(`/spareparts/${partID}`, { method: "PUT", body: JSON.stringify(payload) });
export const deletePart = (partID) => request(`/spareparts/${partID}`, { method: "DELETE" });