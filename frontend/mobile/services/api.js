import config from '../config';

const API_URL = config.API_URL;

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};

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

export const createServiceOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/serviceorders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) throw new Error('Failed to create service order');
  return response.json();
};

export const updateServiceOrder = async (serviceOrderID, orderData) => {
  const response = await fetch(`${API_URL}/serviceorders/${serviceOrderID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) throw new Error('Failed to update service order');
  return response.json();
};

export const deleteServiceOrder = async (serviceOrderID) => {
  const response = await fetch(`${API_URL}/serviceorders/${serviceOrderID}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete service order');
  return response.json();
};
