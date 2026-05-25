import config from "../config";

const API_URL = config.API_URL;

export const getSpareParts = async () => {
  const response = await fetch(`${API_URL}/spareparts`);
  if (!response.ok) throw new Error("Failed to fetch spare parts");
  return response.json();
};

export const getServiceOrders = async (userID) => {
  const response = await fetch(`${API_URL}/serviceorders/${userID}`);
  if (!response.ok) throw new Error("Failed to fetch service orders");
  return response.json();
};

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
};

export const createServiceOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/serviceorders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.error ||
      "Failed to create service order";
    throw new Error(message);
  }

  return responseBody;
};

export const updateServiceOrderStatus = async (orderId, status) => {
  const response = await fetch(`${API_URL}/serviceorders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update service order status");
  return response.json();
};

export const deleteServiceOrder = async (orderId) => {
  const response = await fetch(`${API_URL}/serviceorders/${orderId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Failed to delete service order");
  }

  return response.json();
};

export const updateServiceOrder = async (orderId, data) => {
  const response = await fetch(`${API_URL}/serviceorders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || "Failed to update service order");
  }

  return body;
};

export const deleteAllServiceOrders = async (userId) => {
  const response = await fetch(`${API_URL}/serviceorders/user/${userId}`, {
    method: "DELETE",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || "Failed to delete all service orders");
  }

  return body;
};

export const getFinancialRecords = async (userID) => {
  const response = await fetch(`${API_URL}/financial/${userID}`);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || "Failed to fetch financial records");
  }

  return body;
};

// ─── SHOP ────────────────────────────────────────────────

export const getParts = async () => {
  const res = await fetch(`${API_URL}/spareparts`);
  if (!res.ok) throw new Error("Failed to load parts");
  return res.json();
};

export const getCart = async (userID) => {
  const res = await fetch(`${API_URL}/api/cart/${userID}`);
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
};

export const addToCart = async (userID, partID, quantity = 1) => {
  const res = await fetch(`${API_URL}/api/cart/${userID}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partID, quantity }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to add to cart");

  return data;
};

export const updateCartItem = async (cartItemID, quantity) => {
  const res = await fetch(`${API_URL}/api/cart/items/${cartItemID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to update");

  return data;
};

export const removeFromCart = async (cartItemID) => {
  const res = await fetch(`${API_URL}/api/cart/items/${cartItemID}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to remove item");

  return res.json();
};

export const submitOrder = async (userID) => {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to submit order");

  return data;
};

export const getUserOrders = async (userID) => {
  const res = await fetch(`${API_URL}/api/orders/user/${userID}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
};

export const getOrderDetails = async (orderID) => {
  const res = await fetch(`${API_URL}/api/orders/${orderID}`);
  if (!res.ok) throw new Error("Failed to load order");
  return res.json();
};

export const cancelOrder = async (orderID) => {
  const res = await fetch(`${API_URL}/api/orders/${orderID}/cancel`, {
    method: "PATCH",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to cancel");

  return data;
};

// ─── USERS (Manager) ────────────────────────────────────

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Nije moguće dohvatiti korisnike.");
  return res.json();
};

export const updateUser = async (userId, payload) => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Ažuriranje nije uspjelo.");
  return data;
};

export const deleteUser = async (userId) => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Brisanje nije uspjelo.");
  return data;
};

export const createUser = async (payload) => {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Kreiranje nije uspjelo.");
  return data;
};

export const getAllServiceOrders = async () => {
  const res = await fetch(`${API_URL}/serviceorders`);
  if (!res.ok) throw new Error("Nije moguće dohvatiti servisne naloge.");
  return res.json();
};

export const createPart = async (payload) => {
  const res = await fetch(`${API_URL}/spareparts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Kreiranje nije uspjelo.");
  return data;
};

export const updatePart = async (partID, payload) => {
  const res = await fetch(`${API_URL}/spareparts/${partID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Ažuriranje nije uspjelo.");
  return data;
};

export const deletePart = async (partID) => {
  const res = await fetch(`${API_URL}/spareparts/${partID}`, { method: "DELETE" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Brisanje nije uspjelo.");
  return data;
};