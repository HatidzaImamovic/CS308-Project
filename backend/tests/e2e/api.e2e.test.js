/**
 * FILE LOCATION: backend/tests/e2e/api.e2e.test.js
 *
 * End-to-end (integration) tests for the Express API.
 * A mocked database is injected so no real MySQL instance is needed.
 *
 * Run: npm run test:e2e   (from the backend/ directory)
 */

process.env.JWT_SECRET  = "test_jwt_secret_e2e";
process.env.NODE_ENV    = "test";
process.env.DB_HOST     = "localhost";
process.env.DB_USER     = "root";
process.env.DB_PASSWORD = "";
process.env.DB_NAME     = "test_db";

// ── Mock the database module ───────────────────────────────
const mockDbQuery = jest.fn();
jest.mock("../../database", () => ({ query: mockDbQuery }));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const { app } = require("../../index");

// ── Token factories ────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;

function techToken(userID = 10) {
  return "Bearer " + jwt.sign({ userID, role: "serviser", username: "tech1" }, JWT_SECRET, { expiresIn: "1h" });
}

function managerToken(userID = 1) {
  return "Bearer " + jwt.sign({ userID, role: "menadžer", username: "boss" }, JWT_SECRET, { expiresIn: "1h" });
}

// ── Reset mock between tests ───────────────────────────────
beforeEach(() => mockDbQuery.mockReset());

// ═══════════════════════════════════════════════════════════
// E2E-01  GET /test — public health-check endpoint
// ═══════════════════════════════════════════════════════════
describe("E2E-01: GET /test", () => {
  test("returns 200 and a message without auth", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/backend is working/i);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-02  POST /login — authentication
// ═══════════════════════════════════════════════════════════
describe("E2E-02: POST /login", () => {
  test("POSITIVE – returns token on valid credentials", async () => {
    const bcrypt    = require("bcrypt");
    const hashedPw  = await bcrypt.hash("secret", 10);
    const fakeUser  = { userID: 5, username: "alice", password: hashedPw, role: "serviser" };

    mockDbQuery.mockResolvedValueOnce([[fakeUser]]);

    const res = await request(app)
      .post("/login")
      .send({ username: "alice", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.username).toBe("alice");
  });

  test("NEGATIVE – returns 401 for wrong password", async () => {
    const bcrypt   = require("bcrypt");
    const hashedPw = await bcrypt.hash("correct", 10);
    mockDbQuery.mockResolvedValueOnce([[{ userID: 1, username: "alice", password: hashedPw, role: "serviser" }]]);

    const res = await request(app)
      .post("/login")
      .send({ username: "alice", password: "wrong" });

    expect(res.status).toBe(401);
  });

  test("NEGATIVE – returns 401 for unknown user", async () => {
    mockDbQuery.mockResolvedValueOnce([[]]); // no user found

    const res = await request(app)
      .post("/login")
      .send({ username: "ghost", password: "pw" });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-03  GET /spareparts — requires auth
// ═══════════════════════════════════════════════════════════
describe("E2E-03: GET /spareparts", () => {
  test("POSITIVE – returns spare parts list when authenticated", async () => {
    // ensureDefaultSpareParts → 2 calls, then SELECT
    mockDbQuery
      .mockResolvedValueOnce([[{ COUNT: 0 }]])          // check table existence (ignored internally)
      .mockResolvedValueOnce([[]]) // SELECT sparepart for ensureDefault (empty)
      .mockResolvedValueOnce([[]]) // any internal insert loops resolve quickly
      .mockResolvedValue([[{ partID: 1, name: "Filter", price: 25, stock: 50 }]]);

    const res = await request(app)
      .get("/spareparts")
      .set("Authorization", techToken());

    expect(res.status).toBe(200);
  });

  test("NEGATIVE – returns 401 without auth token", async () => {
    const res = await request(app).get("/spareparts");
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-04  GET /serviceorders/:userID — user's own orders
// ═══════════════════════════════════════════════════════════
describe("E2E-04: GET /serviceorders/:userID", () => {
  test("POSITIVE – technician can fetch their own service orders", async () => {
    mockDbQuery
      .mockResolvedValueOnce([[]])   // serviceorders query
      .mockResolvedValue([[]]);

    const res = await request(app)
      .get("/serviceorders/10")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("NEGATIVE – technician cannot fetch another user's orders", async () => {
    const res = await request(app)
      .get("/serviceorders/99")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(403);
  });

  test("POSITIVE – manager can fetch any user's orders", async () => {
    mockDbQuery.mockResolvedValue([[]]);

    const res = await request(app)
      .get("/serviceorders/10")
      .set("Authorization", managerToken());

    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-05  POST /serviceorders — create a service order
// ═══════════════════════════════════════════════════════════
describe("E2E-05: POST /serviceorders", () => {
  const validOrder = {
    serviceType: "Instalacija",
    serialNumber: "SN-001",
    name: "Emir Begić",
    location: "Vitez",
    date: "2025-01-15",
    userID: 10,
    status: 1,
    spareParts: [],
  };

  function mockCreateOrderDb() {
    mockDbQuery
      // ensureDefaultSpareParts: SELECT sparepart LIMIT 1 (non-empty = no inserts)
      .mockResolvedValueOnce([[{ partID: 1 }]])
      // SELECT deviceID FROM device WHERE serialNumber = ? (not found)
      .mockResolvedValueOnce([[]])
      // INSERT INTO device
      .mockResolvedValueOnce([{ insertId: 77 }])
      // getNextUserOrderNumber: SELECT COUNT(*) FROM serviceorder WHERE userID = ?
      .mockResolvedValueOnce([[{ cnt: 0 }]])
      // INSERT INTO serviceorder
      .mockResolvedValueOnce([{ insertId: 42 }])
      // ensureServiceOrderPartsTable: CREATE TABLE IF NOT EXISTS
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      // INSERT INTO financialrecord
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
  }

  test("POSITIVE – creates service order and returns 201", async () => {
    mockCreateOrderDb();

    const res = await request(app)
      .post("/serviceorders")
      .set("Authorization", techToken(10))
      .send(validOrder);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("serviceOrderID");
  });

  test("NEGATIVE – returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/serviceorders")
      .set("Authorization", techToken(10))
      .send({ userID: 10 }); // missing most fields

    expect(res.status).toBe(400);
  });

  test("NEGATIVE – returns 400 for invalid service type", async () => {
    const res = await request(app)
      .post("/serviceorders")
      .set("Authorization", techToken(10))
      .send({ ...validOrder, serviceType: "Nepoznato" });

    expect(res.status).toBe(400);
  });

  test("NEGATIVE – returns 403 when technician creates order for another user", async () => {
    const res = await request(app)
      .post("/serviceorders")
      .set("Authorization", techToken(10))
      .send({ ...validOrder, userID: 99 });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-06  PUT /serviceorders/:id/status — change order status
// ═══════════════════════════════════════════════════════════
describe("E2E-06: PUT /serviceorders/:id/status", () => {
  test("POSITIVE – manager can update status to 0 (otvoren)", async () => {
    // findServiceOrder + update
    mockDbQuery
      .mockResolvedValueOnce([[{ serviceOrderID: 5, userID: 10, type: "installation", deviceID: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put("/serviceorders/5/status")
      .set("Authorization", managerToken())
      .send({ status: 0 });

    expect(res.status).toBe(200);
  });

  test("NEGATIVE – returns 400 for invalid status value", async () => {
    const res = await request(app)
      .put("/serviceorders/5/status")
      .set("Authorization", managerToken())
      .send({ status: "invalid" });

    expect(res.status).toBe(400);
  });

  test("NEGATIVE – returns 404 when order does not exist", async () => {
    mockDbQuery.mockResolvedValueOnce([[]]); // findServiceOrder returns nothing

    const res = await request(app)
      .put("/serviceorders/999/status")
      .set("Authorization", managerToken())
      .send({ status: 1 });

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-07  DELETE /serviceorders/:id — delete a service order
// ═══════════════════════════════════════════════════════════
describe("E2E-07: DELETE /serviceorders/:id", () => {
  test("POSITIVE – owner can delete their own service order", async () => {
    mockDbQuery
      .mockResolvedValueOnce([[{ serviceOrderID: 7, userID: 10 }]])  // findServiceOrder
      .mockResolvedValueOnce([[]])                                     // ensureServiceOrderPartsTable
      .mockResolvedValueOnce([[]])                                     // SELECT parts
      .mockResolvedValueOnce([{ affectedRows: 1 }])                   // DELETE financialrecord
      .mockResolvedValueOnce([{ affectedRows: 1 }]);                  // DELETE serviceorder

    const res = await request(app)
      .delete("/serviceorders/7")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/obrisan/i);
  });

  test("NEGATIVE – returns 404 for non-existent order", async () => {
    mockDbQuery.mockResolvedValueOnce([[]]); // findServiceOrder empty

    const res = await request(app)
      .delete("/serviceorders/404")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(404);
  });

  test("NEGATIVE – returns 403 when technician tries to delete another user's order", async () => {
    mockDbQuery.mockResolvedValueOnce([[{ serviceOrderID: 8, userID: 99 }]]);

    const res = await request(app)
      .delete("/serviceorders/8")
      .set("Authorization", techToken(10)); // userID 10 ≠ 99

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-08  GET /financial/:userID — financial records
// ═══════════════════════════════════════════════════════════
describe("E2E-08: GET /financial/:userID", () => {
  test("POSITIVE – technician can fetch their own financial records", async () => {
    mockDbQuery.mockResolvedValueOnce([[
      { recordID: 1, serviceOrderID: 1, amount: 120, paymentStatus: 1, serviceType: "installation", createdAt: new Date() },
    ]]);

    const res = await request(app)
      .get("/financial/10")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("NEGATIVE – technician cannot fetch another user's financial records", async () => {
    const res = await request(app)
      .get("/financial/99")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-09  GET /api/cart/:userID — shopping cart
// ═══════════════════════════════════════════════════════════
describe("E2E-09: GET /api/cart/:userID", () => {
  test("POSITIVE – returns cart for authenticated user", async () => {
    mockDbQuery
      .mockResolvedValueOnce([[{ cartID: 3 }]])  // SELECT cart
      .mockResolvedValueOnce([[]]);               // SELECT cartitems

    const res = await request(app)
      .get("/api/cart/10")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("cartID");
  });

  test("NEGATIVE – returns 403 when technician requests another user's cart", async () => {
    const res = await request(app)
      .get("/api/cart/99")
      .set("Authorization", techToken(10));

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════
// E2E-10  POST /api/orders — submit cart as order
// ═══════════════════════════════════════════════════════════
describe("E2E-10: POST /api/orders", () => {
  test("POSITIVE – creates order from cart", async () => {
    mockDbQuery
      .mockResolvedValueOnce([[{ cartID: 3 }]])                                           // SELECT cart
      .mockResolvedValueOnce([[{ partID: 1, quantity: 2, price: 25, stock: 50, name: "Filter" }]]) // cart items
      .mockResolvedValueOnce([[{ COUNT: 0 }]])                                            // getNextUserOrderNumber helper
      .mockResolvedValueOnce([{ insertId: 99 }])                                          // INSERT sparepartsorder
      .mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);                             // INSERT orderitem / UPDATE stock / DELETE cartitem

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", techToken(10))
      .send({ userID: 10 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("orderID");
  });

  test("NEGATIVE – returns 400 when cart is empty", async () => {
    mockDbQuery
      .mockResolvedValueOnce([[{ cartID: 3 }]])  // cart found
      .mockResolvedValueOnce([[]]);               // items empty

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", techToken(10))
      .send({ userID: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  test("NEGATIVE – returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ userID: 10 });

    expect(res.status).toBe(401);
  });
});
