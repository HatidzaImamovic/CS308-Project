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

export const getFinancialRecords = async (userID) => {
  const url = `${API_URL}/financial/${userID}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.log("RESPONSE ERROR BODY:", text);
    throw new Error('Failed to fetch financial records');
  }

  return response.json();
};