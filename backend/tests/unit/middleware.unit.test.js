/**
 * FILE LOCATION: backend/tests/unit/middleware.unit.test.js
 *
 * Unit tests for Express middleware functions and helper utilities
 * exported from index.js: authenticateToken, allowRoles,
 * authorizeUserAccess, normalizeRole, isManager, normalizeSelectedParts.
 *
 * Run: npm run test:unit   (from the backend/ directory)
 */

process.env.JWT_SECRET = "test_jwt_secret_for_unit_tests";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "";
process.env.DB_NAME = "test_db";

// ── Mock the DB so index.js never opens a real connection ──
jest.mock("../../database", () => ({
  query: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Import the app and exported helpers
const {
  authenticateToken,
  allowRoles,
  authorizeUserAccess,
  normalizeRole,
  isManager,
  normalizeSelectedParts,
} = require("../../index");

// ── helpers ────────────────────────────────────────────────

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(overrides = {}) {
  return { headers: {}, params: {}, body: {}, user: null, ...overrides };
}

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

// ═══════════════════════════════════════════════════════════
// 1. normalizeRole
// ═══════════════════════════════════════════════════════════
describe("normalizeRole()", () => {
  test("lowercases and trims a role string", () => {
    expect(normalizeRole("  Menadžer  ")).toBe("menadžer");
  });

  test("returns empty string for undefined", () => {
    expect(normalizeRole(undefined)).toBe("");
  });

  test("returns empty string for null", () => {
    expect(normalizeRole(null)).toBe("");
  });

  test("returns the same lowercase string for already-normalised role", () => {
    expect(normalizeRole("serviser")).toBe("serviser");
  });
});

// ═══════════════════════════════════════════════════════════
// 2. isManager
// ═══════════════════════════════════════════════════════════
describe("isManager()", () => {
  test("returns true for menadžer (with accent)", () => {
    expect(isManager("menadžer")).toBe(true);
  });

  test("returns true for manager (without accent)", () => {
    expect(isManager("manager")).toBe(true);
  });

  test("returns true regardless of casing", () => {
    expect(isManager("MENADŽER")).toBe(true);
  });

  test("returns false for serviser", () => {
    expect(isManager("serviser")).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isManager(undefined)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// 3. normalizeSelectedParts
// ═══════════════════════════════════════════════════════════
describe("normalizeSelectedParts()", () => {
  test("converts string IDs to numbers and keeps quantity", () => {
    const result = normalizeSelectedParts([{ partID: "3", quantity: 2 }]);
    expect(result[0].partID).toBe(3);
    expect(result[0].quantity).toBe(2);
  });

  test("defaults quantity to 1 when missing", () => {
    const result = normalizeSelectedParts([{ partID: 5 }]);
    expect(result[0].quantity).toBe(1);
  });

  test("filters out parts with quantity <= 0", () => {
    const result = normalizeSelectedParts([
      { partID: 1, quantity: 0 },
      { partID: 2, quantity: -1 },
    ]);
    expect(result).toHaveLength(0);
  });

  test("returns empty array when input is empty", () => {
    expect(normalizeSelectedParts([])).toEqual([]);
  });

  test("handles multiple valid parts", () => {
    const result = normalizeSelectedParts([
      { partID: "1", quantity: 3 },
      { partID: "2", quantity: 5 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[1].partID).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. authenticateToken middleware
// ═══════════════════════════════════════════════════════════
describe("authenticateToken middleware", () => {
  test("returns 401 when no token is supplied", () => {
    const req  = makeReq();
    const res  = makeRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when token is invalid / expired", () => {
    const req  = makeReq({ headers: { authorization: "Bearer invalid.token.here" } });
    const res  = makeRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next() and attaches user when token is valid", () => {
    const payload = { userID: 1, role: "serviser", username: "john" };
    const token   = sign(payload);
    const req     = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res     = makeRes();
    const next    = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.userID).toBe(1);
  });

  test("accepts token without 'Bearer ' prefix", () => {
    const token = sign({ userID: 2, role: "serviser" });
    const req   = makeReq({ headers: { authorization: token } });
    const res   = makeRes();
    const next  = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════
// 5. allowRoles middleware
// ═══════════════════════════════════════════════════════════
describe("allowRoles middleware", () => {
  test("calls next() when user role is in the allowed list", () => {
    const req  = makeReq({ user: { role: "menadžer" } });
    const res  = makeRes();
    const next = jest.fn();

    allowRoles("menadžer", "serviser")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 403 when user role is not allowed", () => {
    const req  = makeReq({ user: { role: "serviser" } });
    const res  = makeRes();
    const next = jest.fn();

    allowRoles("menadžer")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when user has no role", () => {
    const req  = makeReq({ user: {} });
    const res  = makeRes();
    const next = jest.fn();

    allowRoles("menadžer")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ═══════════════════════════════════════════════════════════
// 6. authorizeUserAccess middleware
// ═══════════════════════════════════════════════════════════
describe("authorizeUserAccess middleware", () => {
  test("calls next() when requesting user accesses their own resource", () => {
    const req  = makeReq({ user: { userID: 42, role: "serviser" }, params: { userID: "42" } });
    const res  = makeRes();
    const next = jest.fn();

    authorizeUserAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("calls next() when a manager accesses another user's resource", () => {
    const req  = makeReq({ user: { userID: 1, role: "menadžer" }, params: { userID: "99" } });
    const res  = makeRes();
    const next = jest.fn();

    authorizeUserAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 403 when a non-manager accesses another user's resource", () => {
    const req  = makeReq({ user: { userID: 1, role: "serviser" }, params: { userID: "99" } });
    const res  = makeRes();
    const next = jest.fn();

    authorizeUserAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 400 for a non-numeric userID in params", () => {
    const req  = makeReq({ user: { userID: 1, role: "serviser" }, params: { userID: "abc" } });
    const res  = makeRes();
    const next = jest.fn();

    authorizeUserAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
