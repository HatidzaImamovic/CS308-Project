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

export const getFinancialRecords = async (userID) => {
  const url = `${API_URL}/financial/${userID}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.log("RESPONSE ERROR BODY:", text);
    throw new Error('Failed to fetch financial records');
  }

  return response.json();
};
