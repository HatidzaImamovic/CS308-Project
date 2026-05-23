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
