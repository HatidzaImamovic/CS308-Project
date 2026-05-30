import config from "../config";

const API_URL = config.API_URL;

// ─── HELPER ────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
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