import config from '../config';

const API_URL = config.API_URL;

export const getSpareParts = async () => {
  const response = await fetch(`${API_URL}/spareparts`);
  if (!response.ok) throw new Error('Failed to fetch spare parts');
  return response.json();
};

export const getServiceOrders = async (userID) => {
  const response = await fetch(`${API_URL}/serviceorders/${userID}`);
  if (!response.ok) throw new Error('Failed to fetch service orders');
  return response.json();
};

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};
// ─── SHOP ────────────────────────────────────────────────

export const getParts = async () => {
  const res = await fetch(`${API_URL}/spareparts`);
  if (!res.ok) throw new Error('Failed to load parts');
  return res.json();
};

export const getCart = async (userID) => {
  const res = await fetch(`${API_URL}/api/cart/${userID}`);
  if (!res.ok) throw new Error('Failed to load cart');
  return res.json();
};

export const addToCart = async (userID, partID, quantity = 1) => {
  const res = await fetch(`${API_URL}/api/cart/${userID}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partID, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add to cart');
  return data;
};

export const updateCartItem = async (cartItemID, quantity) => {
  const res = await fetch(`${API_URL}/api/cart/items/${cartItemID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update');
  return data;
};

export const removeFromCart = async (cartItemID) => {
  const res = await fetch(`${API_URL}/api/cart/items/${cartItemID}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove item');
  return res.json();
};

export const submitOrder = async (userID) => {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userID }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit order');
  return data;
};

export const getUserOrders = async (userID) => {
  const res = await fetch(`${API_URL}/api/orders/user/${userID}`);
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
};

export const getOrderDetails = async (orderID) => {
  const res = await fetch(`${API_URL}/api/orders/${orderID}`);
  if (!res.ok) throw new Error('Failed to load order');
  return res.json();
};

export const cancelOrder = async (orderID) => {
  const res = await fetch(`${API_URL}/api/orders/${orderID}/cancel`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel');
  return data;
};