/**
 * FILE LOCATION: frontend/mobile/tests/api.service.test.js
 *
 * Unit tests for services/api.js.
 * Native modules are replaced by manual mocks in tests/__mocks__/
 * Run: npm test   (from frontend/mobile/)
 */

jest.mock("../config", () => ({ API_URL: "http://localhost:3000" }));

global.fetch = jest.fn();

const SecureStore  = require("expo-secure-store");
const AsyncStorage = require("@react-native-async-storage/async-storage");

const {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  saveUserSession,
  getUserSession,
  clearUserSession,
  getDrafts,
  saveDrafts,
  removeDraftById,
  login,
  logout,
  getSpareParts,
  getServiceOrders,
  createServiceOrder,
  deleteServiceOrder,
  getCart,
  addToCart,
  removeFromCart,
  submitOrder,
  getUserOrders,
} = require("../services/api");

function mockFetch(body, status = 200) {
  fetch.mockResolvedValueOnce({
    ok:   status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetchFail(body, status = 400) {
  fetch.mockResolvedValueOnce({
    ok:   false,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockResolvedValue(null);
});

// ═══════════════════════════════════════════════════════════
// 1. Token storage helpers
// ═══════════════════════════════════════════════════════════
describe("Token helpers", () => {
  test("getAuthToken returns value from SecureStore", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("my-token");
    const token = await getAuthToken();
    expect(token).toBe("my-token");
  });

  test("getAuthToken returns null on SecureStore error", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("oops"));
    const token = await getAuthToken();
    expect(token).toBeNull();
  });

  test("saveAuthToken calls SecureStore.setItemAsync", async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    await saveAuthToken("tok123");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringContaining("AUTH_TOKEN"),
      "tok123"
    );
  });

  test("clearAuthToken calls SecureStore.deleteItemAsync", async () => {
    SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);
    await clearAuthToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// 2. Session helpers
// ═══════════════════════════════════════════════════════════
describe("Session helpers", () => {
  test("saveUserSession serialises and stores user object", async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    await saveUserSession({ userID: 5, username: "alice" });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ userID: 5, username: "alice" })
    );
  });

  test("getUserSession parses and returns stored user", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({ userID: 5, username: "alice" })
    );
    const user = await getUserSession();
    expect(user.username).toBe("alice");
  });

  test("getUserSession returns null when nothing is stored", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    const user = await getUserSession();
    expect(user).toBeNull();
  });

  test("clearUserSession calls deleteItemAsync", async () => {
    SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);
    await clearUserSession();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. Draft helpers
// ═══════════════════════════════════════════════════════════
describe("Draft helpers", () => {
  test("getDrafts returns parsed drafts from SecureStore", async () => {
    const drafts = [{ id: "1", serviceType: "Instalacija" }];
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(drafts));
    const result = await getDrafts(10);
    expect(result).toHaveLength(1);
    expect(result[0].serviceType).toBe("Instalacija");
  });

  test("getDrafts returns empty array when nothing stored", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const result = await getDrafts(10);
    expect(result).toEqual([]);
  });

  test("saveDrafts stores serialised draft array", async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    const drafts = [{ id: "1" }];
    await saveDrafts(10, drafts);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringContaining("10"),
      JSON.stringify(drafts)
    );
  });

  test("removeDraftById removes the correct draft", async () => {
    const drafts = [{ id: "1" }, { id: "2" }];
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(drafts));
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    await removeDraftById(10, "1");
    const savedArg = SecureStore.setItemAsync.mock.calls[0][1];
    const saved    = JSON.parse(savedArg);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("2");
  });
});

// ═══════════════════════════════════════════════════════════
// 4. login() / logout()
// ═══════════════════════════════════════════════════════════
describe("login() and logout()", () => {
  test("POSITIVE – login resolves with user and token on success", async () => {
    mockFetch({ user: { userID: 1 }, token: "jwt.tok" });
    const data = await login("alice", "secret");
    expect(data.token).toBe("jwt.tok");
  });

  test("NEGATIVE – login throws on 401 response", async () => {
    mockFetchFail({ message: "Wrong credentials" }, 401);
    await expect(login("alice", "bad")).rejects.toThrow("Wrong credentials");
  });

  test("logout clears both token and session", async () => {
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    await logout();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════
// 5. Spare parts
// ═══════════════════════════════════════════════════════════
describe("getSpareParts()", () => {
  test("POSITIVE – returns array of parts", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch([{ partID: 1, name: "Filter" }]);
    const parts = await getSpareParts();
    expect(Array.isArray(parts)).toBe(true);
    expect(parts[0].name).toBe("Filter");
  });

  test("NEGATIVE – throws on server error", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetchFail({ error: "DB error" }, 500);
    await expect(getSpareParts()).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════
// 6. Service orders
// ═══════════════════════════════════════════════════════════
describe("Service order API calls", () => {
  test("POSITIVE – getServiceOrders returns orders for user", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch([{ serviceOrderID: 1, type: "installation" }]);
    const orders = await getServiceOrders(10);
    expect(orders[0].type).toBe("installation");
  });

  test("POSITIVE – createServiceOrder resolves with new order ID", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ serviceOrderID: 42 }, 201);
    const result = await createServiceOrder({
      serviceType: "Instalacija", serialNumber: "SN-1",
      name: "Test", location: "Vitez", date: "2025-01-01", userID: 10,
    });
    expect(result.serviceOrderID).toBe(42);
  });

  test("NEGATIVE – createServiceOrder throws when validation fails on server", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetchFail({ message: "Nedostaju obavezni podaci" }, 400);
    await expect(createServiceOrder({})).rejects.toThrow();
  });

  test("POSITIVE – deleteServiceOrder resolves with success message", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ message: "Servisni nalog je obrisan" });
    const result = await deleteServiceOrder(7);
    expect(result.message).toMatch(/obrisan/i);
  });
});

// ═══════════════════════════════════════════════════════════
// 7. Cart and orders
// ═══════════════════════════════════════════════════════════
describe("Cart and orders API calls", () => {
  test("POSITIVE – getCart returns cart with items and total", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ cartID: 3, items: [], total: 0 });
    const cart = await getCart(10);
    expect(cart.cartID).toBe(3);
  });

  test("POSITIVE – addToCart resolves on success", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ message: "Item added to cart" });
    const result = await addToCart(10, 1, 2);
    expect(result.message).toMatch(/added/i);
  });

  test("NEGATIVE – addToCart throws when stock insufficient", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetchFail({ error: "Not enough stock" }, 400);
    await expect(addToCart(10, 1, 999)).rejects.toThrow("Not enough stock");
  });

  test("POSITIVE – removeFromCart resolves successfully", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ message: "Item removed" });
    const result = await removeFromCart(5);
    expect(result.message).toMatch(/removed/i);
  });

  test("POSITIVE – submitOrder returns orderID", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch({ orderID: 99, orderNumber: 1 }, 201);
    const result = await submitOrder(10);
    expect(result.orderID).toBe(99);
  });

  test("NEGATIVE – submitOrder throws when cart is empty", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetchFail({ error: "Cart is empty" }, 400);
    await expect(submitOrder(10)).rejects.toThrow("Cart is empty");
  });

  test("POSITIVE – getUserOrders returns list of orders", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("tok");
    mockFetch([{ sparePartsOrderID: 1, status: "pending" }]);
    const orders = await getUserOrders(10);
    expect(orders[0].status).toBe("pending");
  });
});
