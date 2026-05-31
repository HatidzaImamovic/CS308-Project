/**
 * FILE LOCATION: backend/helpers.js
 *
 * Utility functions used throughout index.js.
 * This file must exist for the backend to start and for tests to run.
 */

const db = require("./database");

const DEFAULT_SPARE_PARTS = [
  { name: "Filter",    description: "Standard replacement filter", price: 25,  stock: 50  },
  { name: "Pumpa",     description: "Circulation pump",            price: 140, stock: 12  },
  { name: "Termostat", description: "Boiler thermostat",           price: 45,  stock: 25  },
  { name: "Ventil",    description: "Safety valve",                price: 35,  stock: 30  },
  { name: "Brtva",     description: "Replacement gasket",          price: 10,  stock: 100 },
];

// ── Role helpers ───────────────────────────────────────────

const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : "";

const isManager = (role) => {
  const r = normalizeRole(role);
  return r === "menadžer" || r === "menadzer" || r === "manager";
};

// ── Parts helpers ──────────────────────────────────────────

const normalizeSelectedParts = (parts = []) =>
  parts
    .map((p) => ({ partID: Number(p.partID), quantity: Number(p.quantity ?? 1) }))
    .filter((p) => p.quantity > 0);

const loadAndValidateSelectedParts = async (selectedParts) => {
  if (!selectedParts || selectedParts.length === 0) return [];

  const [rows] = await db.query(
    "SELECT partID, name, price, stock FROM sparepart WHERE partID IN (?)",
    [selectedParts.map((p) => p.partID)]
  );

  const byId = new Map(rows.map((r) => [Number(r.partID), r]));

  for (const sp of selectedParts) {
    const part = byId.get(sp.partID);
    if (!part) {
      const err = new Error("Odabrani rezervni dio nije pronađen");
      err.statusCode = 400;
      throw err;
    }
    if (Number(part.stock) < sp.quantity) {
      const err = new Error(`Nema dovoljno zaliha za dio "${part.name}"`);
      err.statusCode = 400;
      throw err;
    }
  }

  return rows;
};

// ── DB-init helpers ────────────────────────────────────────

const ensureDefaultSpareParts = async () => {
  const [existing] = await db.query("SELECT partID FROM sparepart LIMIT 1");
  if (existing.length === 0) {
    for (const part of DEFAULT_SPARE_PARTS) {
      await db.query(
        "INSERT INTO sparepart (name, description, price, stock) VALUES (?, ?, ?, ?)",
        [part.name, part.description, part.price, part.stock]
      );
    }
  }
};

const ensureServiceOrderPartsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS serviceorderpart (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      serviceOrderID INT NOT NULL,
      partID        INT NOT NULL,
      quantity      INT NOT NULL DEFAULT 1,
      unitPrice     DECIMAL(10,2) NOT NULL DEFAULT 0
    )
  `);
};

// ── Order-number helper ────────────────────────────────────

const getNextUserOrderNumber = async (dbInstance, tableName, userID) => {
  const col  = tableName === "sparepartsorder" ? "sparePartsOrderID" : "serviceOrderID";
  const [rows] = await dbInstance.query(
    `SELECT COUNT(*) AS cnt FROM ${tableName} WHERE userID = ?`,
    [userID]
  );
  return Number(rows[0].cnt) + 1;
};

// ── Service-order lookup ───────────────────────────────────

const findServiceOrder = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM serviceorder WHERE serviceOrderID = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

// ── Sync spare parts for an existing order ─────────────────

const syncServiceOrderParts = async (serviceOrderID, selectedParts) => {
  await ensureServiceOrderPartsTable();

  // Restore stock for previously attached parts
  const [oldParts] = await db.query(
    "SELECT partID, quantity FROM serviceorderpart WHERE serviceOrderID = ?",
    [serviceOrderID]
  );
  for (const op of oldParts) {
    await db.query("UPDATE sparepart SET stock = stock + ? WHERE partID = ?", [
      op.quantity,
      op.partID,
    ]);
  }
  await db.query("DELETE FROM serviceorderpart WHERE serviceOrderID = ?", [
    serviceOrderID,
  ]);

  let partsTotal = 0;
  const partDescriptions = [];

  if (selectedParts.length > 0) {
    const [parts] = await db.query(
      "SELECT partID, name, price, stock FROM sparepart WHERE partID IN (?)",
      [selectedParts.map((p) => p.partID)]
    );
    const byId = new Map(parts.map((p) => [Number(p.partID), p]));

    for (const sp of selectedParts) {
      const part = byId.get(sp.partID);
      if (!part) {
        const err = new Error("Odabrani rezervni dio nije pronađen");
        err.statusCode = 400;
        throw err;
      }
      if (Number(part.stock) < sp.quantity) {
        const err = new Error(`Nema dovoljno zaliha za dio "${part.name}"`);
        err.statusCode = 400;
        throw err;
      }

      const lineTotal = Number(part.price) * sp.quantity;
      partsTotal += lineTotal;
      partDescriptions.push(
        `${part.name} x${sp.quantity} (${lineTotal.toFixed(2)} KM)`
      );

      await db.query("UPDATE sparepart SET stock = stock - ? WHERE partID = ?", [
        sp.quantity,
        sp.partID,
      ]);
      await db.query(
        "INSERT INTO serviceorderpart (serviceOrderID, partID, quantity, unitPrice) VALUES (?, ?, ?, ?)",
        [serviceOrderID, sp.partID, sp.quantity, Number(part.price)]
      );
    }
  }

  return { partsTotal, partDescriptions };
};

module.exports = {
  normalizeRole,
  isManager,
  normalizeSelectedParts,
  loadAndValidateSelectedParts,
  ensureDefaultSpareParts,
  ensureServiceOrderPartsTable,
  getNextUserOrderNumber,
  findServiceOrder,
  syncServiceOrderParts,
};
