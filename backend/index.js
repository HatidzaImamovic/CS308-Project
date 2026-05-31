require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("./database");
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const {
  normalizeRole,
  isManager,
  ensureDefaultSpareParts,
  ensureServiceOrderPartsTable,
  normalizeSelectedParts,
  loadAndValidateSelectedParts,
  syncServiceOrderParts,
  getNextUserOrderNumber,
  findServiceOrder,
} = require("./helpers");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  const role = normalizeRole(req.user?.role);
  if (roles.some((allowed) => normalizeRole(allowed) === role)) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
};

const authorizeUserAccess = (req, res, next) => {
  const { userID } = req.params;
  const currentUserId = Number(req.user?.userID);
  const requestedUserId = Number(userID);

  if (Number.isNaN(requestedUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (currentUserId === requestedUserId || isManager(req.user?.role)) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};

app.use(["/spareparts", "/serviceorders", "/financial", "/api", "/users"], authenticateToken);
app.use(express.json());

const SERVICE_PRICES = {
  installation: 120,
  repair: 80,
  maintenance: 60,
};

const DEFAULT_SPARE_PARTS = [
  {
    name: "Filter",
    description: "Standard replacement filter",
    price: 25,
    stock: 50,
  },
  {
    name: "Pumpa",
    description: "Circulation pump",
    price: 140,
    stock: 12,
  },
  {
    name: "Termostat",
    description: "Boiler thermostat",
    price: 45,
    stock: 25,
  },
  {
    name: "Ventil",
    description: "Safety valve",
    price: 35,
    stock: 30,
  },
  {
    name: "Brtva",
    description: "Replacement gasket",
    price: 10,
    stock: 100,
  },
];

// ─── TEST ─────────────────────────────────────────────────
app.get("/test", (req, res) => {
  res.json({ message: "Backend is working!", timestamp: new Date() });
});

// ─── AUTH ─────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM user WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Pogrešno korisničko ime ili lozinka" });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (isMatch) {
      const token = jwt.sign(
        {
          userID: rows[0].userID,
          role: rows[0].role,
          username: rows[0].username,
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      res.json({ user: rows[0], token });
    } else {
      res.status(401).json({ message: "Pogrešno korisničko ime ili lozinka" });
    }
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── SPARE PARTS ──────────────────────────────────────────
app.get("/spareparts", async (req, res) => {
  try {
    await ensureDefaultSpareParts();
    const [rows] = await db.query("SELECT * FROM sparepart");
    res.json(rows);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── SERVICE ORDERS ───────────────────────────────────────
app.get("/serviceorders/:userID", async (req, res) => {
  if (Number(req.user.userID) !== Number(req.params.userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [rows] = await db.query(
      `SELECT so.*, d.serialNumber, d.ownerName AS name, d.model AS location, d.installDate AS date, f.amount AS totalAmount
       FROM serviceorder so
       LEFT JOIN device d ON so.deviceID = d.deviceID
       LEFT JOIN financialrecord f ON so.serviceOrderID = f.serviceOrderID
       WHERE so.userID = ?
       ORDER BY so.createdAt DESC`,
      [req.params.userID]
    );

    const orderIds = rows.map((row) => row.serviceOrderID);

    if (orderIds.length > 0) {
      await ensureServiceOrderPartsTable();
      const [partRows] = await db.query(
        "SELECT serviceOrderID, partID, quantity FROM serviceorderpart WHERE serviceOrderID IN (?)",
        [orderIds]
      );
      const partsByOrder = partRows.reduce((acc, part) => {
        const key = Number(part.serviceOrderID);
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          partID: Number(part.partID),
          quantity: Number(part.quantity),
        });
        return acc;
      }, {});

      rows.forEach((row) => {
        row.spareParts = partsByOrder[Number(row.serviceOrderID)] || [];
      });
    }

    res.json(rows);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/serviceorders", async (req, res) => {
  const {
    serviceType,
    serialNumber,
    name,
    location,
    date,
    userID,
    status = 1,
    spareParts = [],
  } = req.body;

  if (Number(req.user.userID) !== Number(userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!serviceType || !serialNumber || !name || !location || !date || !userID) {
    return res.status(400).json({ message: "Nedostaju obavezni podaci" });
  }

  const typeMap = {
    Instalacija: "installation",
    Popravak: "repair",
    Održavanje: "maintenance",
  };

  const typeValue = typeMap[serviceType];

  if (!typeValue) {
    return res.status(400).json({ message: "Nevažeći tip servisa" });
  }

  const statusValue =
    status === 1 || status === "1"
      ? 1
      : status === 0 || status === "0"
        ? 0
        : null;

  if (statusValue === null) {
    return res
      .status(400)
      .json({ message: "Nevažeći status. Dozvoljeni statusi: 0, 1" });
  }

  const selectedParts = normalizeSelectedParts(spareParts);

  try {
    await ensureDefaultSpareParts();

    const [deviceRows] = await db.query(
      "SELECT deviceID FROM device WHERE serialNumber = ?",
      [serialNumber]
    );

    let deviceID;

    if (deviceRows.length > 0) {
      deviceID = deviceRows[0].deviceID;

      await db.query(
        "UPDATE device SET model = ?, installDate = ?, ownerName = ? WHERE deviceID = ?",
        [location, date, name, deviceID]
      );
    } else {
      const [deviceInsert] = await db.query(
        "INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)",
        [serialNumber, location, date, name]
      );

      deviceID = deviceInsert.insertId;
    }

    const servicePrice = SERVICE_PRICES[typeValue] || 0;
    let partsTotal = 0;
    const partDescriptions = [];

    if (selectedParts.length > 0) {
      const [parts] = await db.query(
        `SELECT partID, name, price, stock
         FROM sparepart
         WHERE partID IN (?)`,
        [selectedParts.map((part) => part.partID)]
      );

      const partsById = new Map(parts.map((part) => [Number(part.partID), part]));

      for (const selectedPart of selectedParts) {
        const part = partsById.get(selectedPart.partID);

        if (!part) {
          return res
            .status(400)
            .json({ message: "Odabrani rezervni dio nije pronađen" });
        }

        if (Number(part.stock) < selectedPart.quantity) {
          return res.status(400).json({
            message: `Nema dovoljno zaliha za dio "${part.name}"`,
          });
        }

        const partTotal = Number(part.price) * selectedPart.quantity;
        partsTotal += partTotal;
        partDescriptions.push(
          `${part.name} x${selectedPart.quantity} (${partTotal.toFixed(2)} KM)`
        );
      }
    }

    const totalAmount = servicePrice + partsTotal;
    const sparePartsDescription =
      partDescriptions.length > 0 ? partDescriptions.join(", ") : "Nema";
    const description = `Serial: ${serialNumber}; Ime: ${name}; Lokacija: ${location}; Servis: ${servicePrice.toFixed(2)} KM; Rezervni dijelovi: ${sparePartsDescription}; Ukupno: ${totalAmount.toFixed(2)} KM`;

    const orderNumber = await getNextUserOrderNumber(db, "serviceorder", userID);

    const [result] = await db.query(
      "INSERT INTO serviceorder (type, status, deviceID, userID, orderNumber, createdAt, description) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [typeValue, statusValue, deviceID, userID, orderNumber, description]
    );

    for (const selectedPart of selectedParts) {
      await db.query("UPDATE sparepart SET stock = stock - ? WHERE partID = ?", [
        selectedPart.quantity,
        selectedPart.partID,
      ]);
    }

    await ensureServiceOrderPartsTable();
    for (const selectedPart of selectedParts) {
      const [[part]] = await db.query(
        "SELECT price FROM sparepart WHERE partID = ?",
        [selectedPart.partID]
      );
      await db.query(
        "INSERT INTO serviceorderpart (serviceOrderID, partID, quantity, unitPrice) VALUES (?, ?, ?, ?)",
        [result.insertId, selectedPart.partID, selectedPart.quantity, Number(part.price)]
      );
    }

    await db.query(
      "INSERT INTO financialrecord (serviceOrderID, amount, paymentStatus, createdAt) VALUES (?, ?, ?, NOW())",
      [result.insertId, totalAmount, 1]
    );

    res.status(201).json({
      id: result.insertId,
      serviceOrderID: result.insertId,
      orderNumber,
      type: typeValue,
      status: statusValue,
      deviceID,
      userID,
      createdAt: new Date(),
      description,
      servicePrice,
      partsTotal,
      totalAmount,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put("/serviceorders/:id", async (req, res) => {
  const { id } = req.params;
  const { serviceType, serialNumber, name, location, date, status, spareParts = [] } = req.body;

  const typeMap = {
    Instalacija: "installation",
    Popravak: "repair",
    Održavanje: "maintenance",
  };

  const typeValue = serviceType ? typeMap[serviceType] || serviceType : null;

  let normalizedStatus = null;

  if (status === 0 || status === "0" || status === "otvoren") {
    normalizedStatus = 0;
  } else if (status === 1 || status === "1" || status === "zatvoren") {
    normalizedStatus = 1;
  }

  try {
    const existing = await findServiceOrder(id);

    if (!existing) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    if (Number(existing.userID) !== Number(req.user.userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let deviceID = existing.deviceID;

    if (serialNumber) {
      const [deviceRows] = await db.query(
        "SELECT deviceID FROM device WHERE serialNumber = ?",
        [serialNumber]
      );

      if (deviceRows.length > 0) {
        deviceID = deviceRows[0].deviceID;
      } else {
        const [deviceInsert] = await db.query(
          "INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)",
          [serialNumber, location || "", date || null, name || ""]
        );

        deviceID = deviceInsert.insertId;
      }

      await db.query(
        "UPDATE device SET model = ?, installDate = ?, ownerName = ? WHERE deviceID = ?",
        [location || "", date || null, name || "", deviceID]
      );
    }

    const effectiveType = typeValue || existing.type;
    const selectedParts = normalizeSelectedParts(spareParts);
    const servicePrice = SERVICE_PRICES[effectiveType] || 0;
    const { partsTotal, partDescriptions } = await syncServiceOrderParts(
      existing.serviceOrderID,
      selectedParts
    );
    const totalAmount = servicePrice + partsTotal;
    const sparePartsDescription =
      partDescriptions.length > 0 ? partDescriptions.join(", ") : "Nema";
    const description = `Serial: ${serialNumber || ""}; Ime: ${name || ""}; Lokacija: ${location || ""}; Servis: ${servicePrice.toFixed(2)} KM; Rezervni dijelovi: ${sparePartsDescription}; Ukupno: ${totalAmount.toFixed(2)} KM`;

    const updates = [];
    const params = [];

    if (typeValue) {
      updates.push("type = ?");
      params.push(typeValue);
    }

    if (normalizedStatus !== null) {
      updates.push("status = ?");
      params.push(normalizedStatus);
    }

    if (deviceID) {
      updates.push("deviceID = ?");
      params.push(deviceID);
    }

    updates.push("description = ?");
    params.push(description);

    params.push(existing.serviceOrderID);

    const sql = `UPDATE serviceorder SET ${updates.join(", ")} WHERE serviceOrderID = ? LIMIT 1`;

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Servisni nalog nije pronađen za ažuriranje" });
    }

    const [financialUpdate] = await db.query(
      "UPDATE financialrecord SET amount = ? WHERE serviceOrderID = ?",
      [totalAmount, existing.serviceOrderID]
    );

    if (financialUpdate.affectedRows === 0) {
      await db.query(
        "INSERT INTO financialrecord (serviceOrderID, amount, paymentStatus, createdAt) VALUES (?, ?, ?, NOW())",
        [existing.serviceOrderID, totalAmount, 1]
      );
    }

    res.json({
      message: "Servisni nalog je ažuriran",
      totalAmount,
      partsTotal,
      servicePrice,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put("/serviceorders/:id/status", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  let normalizedStatus = null;

  if (status === 0 || status === "0" || status === "otvoren") {
    normalizedStatus = 0;
  } else if (status === 1 || status === "1" || status === "zatvoren") {
    normalizedStatus = 1;
  }

  if (normalizedStatus === null) {
    return res.status(400).json({
      message: "Nevažeći status. Dozvoljeni statusi: 0, 1, otvoren, zatvoren",
    });
  }

  try {
    const existing = await findServiceOrder(id);

    if (!existing) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    if (Number(existing.userID) !== Number(req.user.userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [result] = await db.query(
      "UPDATE serviceorder SET status = ? WHERE serviceOrderID = ? LIMIT 1",
      [normalizedStatus, existing.serviceOrderID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    res.json({ message: "Status servisnog naloga je ažuriran", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/serviceorders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await findServiceOrder(id);

    if (!existing) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    if (Number(existing.userID) !== Number(req.user.userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await ensureServiceOrderPartsTable();
    const [orderParts] = await db.query(
      "SELECT partID, quantity FROM serviceorderpart WHERE serviceOrderID = ?",
      [existing.serviceOrderID]
    );

    for (const part of orderParts) {
      await db.query("UPDATE sparepart SET stock = stock + ? WHERE partID = ?", [
        part.quantity,
        part.partID,
      ]);
    }

    await db.query("DELETE FROM financialrecord WHERE serviceOrderID = ?", [
      existing.serviceOrderID,
    ]);

    const [result] = await db.query(
      "DELETE FROM serviceorder WHERE serviceOrderID = ? LIMIT 1",
      [existing.serviceOrderID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    res.json({ message: "Servisni nalog je obrisan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/serviceorders/user/:userID", async (req, res) => {
  const { userID } = req.params;

  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM serviceorder WHERE userID = ?",
      [userID]
    );

    res.json({
      message: "Deleted service orders",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ─── FINANCIAL RECORDS ────────────────────────────────────
app.get("/financial/:userID", async (req, res) => {
  if (Number(req.user.userID) !== Number(req.params.userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const userID = req.params.userID;

    const query = `
      SELECT
        COALESCE(f.recordID, s.serviceOrderID) AS recordID,
        s.serviceOrderID,
        s.orderNumber AS serviceOrderNumber,
        NULL AS sparePartsOrderID,
        f.amount AS amount,
        1 AS paymentStatus,
        COALESCE(f.createdAt, s.createdAt) AS createdAt,
        s.type AS serviceType,
        s.description
      FROM serviceorder s
      LEFT JOIN financialrecord f ON f.serviceOrderID = s.serviceOrderID
      WHERE s.userID = ?
      ORDER BY COALESCE(f.createdAt, s.createdAt) DESC
    `;

    const [serviceResults] = await db.query(query, [userID]);

    const normalizedResults = serviceResults.map((record) => ({
      ...record,
      amount:
        record.amount === null || record.amount === undefined
          ? SERVICE_PRICES[record.serviceType] || 0
          : record.amount,
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(normalizedResults);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ─── CART ─────────────────────────────────────────────────
app.get("/api/cart/:userID", async (req, res) => {
  if (Number(req.user.userID) !== Number(req.params.userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userID } = req.params;

    const [existing] = await db.query(
      "SELECT cartID FROM cart WHERE userID = ?",
      [userID]
    );

    let cartID;

    if (existing.length > 0) {
      cartID = existing[0].cartID;
    } else {
      const [result] = await db.query(
        "INSERT INTO cart (userID, createdAt) VALUES (?, NOW())",
        [userID]
      );

      cartID = result.insertId;
    }

    const [items] = await db.query(
      `SELECT ci.cartItemID, ci.quantity, s.partID, s.name, s.description, s.price, s.stock
       FROM cartitem ci 
       JOIN sparepart s ON ci.partID = s.partID
       WHERE ci.cartID = ?`,
      [cartID]
    );

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    res.json({ cartID, items, total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/api/cart/:userID/items", async (req, res) => {
  if (Number(req.user.userID) !== Number(req.params.userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { userID } = req.params;
    const { partID, quantity = 1 } = req.body;

    if (!partID) {
      return res.status(400).json({ error: "partID is required" });
    }

    const [parts] = await db.query("SELECT stock FROM sparepart WHERE partID = ?", [
      partID,
    ]);

    if (parts.length === 0) {
      return res.status(404).json({ error: "Part not found" });
    }

    if (parts[0].stock < quantity) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    const [existing] = await db.query(
      "SELECT cartID FROM cart WHERE userID = ?",
      [userID]
    );

    let cartID;

    if (existing.length > 0) {
      cartID = existing[0].cartID;
    } else {
      const [result] = await db.query(
        "INSERT INTO cart (userID, createdAt) VALUES (?, NOW())",
        [userID]
      );

      cartID = result.insertId;
    }

    const [cartItem] = await db.query(
      "SELECT cartItemID, quantity FROM cartitem WHERE cartID = ? AND partID = ?",
      [cartID, partID]
    );

    if (cartItem.length > 0) {
      await db.query("UPDATE cartitem SET quantity = ? WHERE cartItemID = ?", [
        cartItem[0].quantity + quantity,
        cartItem[0].cartItemID,
      ]);
    } else {
      await db.query(
        "INSERT INTO cartitem (cartID, partID, quantity) VALUES (?, ?, ?)",
        [cartID, partID, quantity]
      );
    }

    res.json({ message: "Item added to cart" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

app.put("/api/cart/items/:cartItemID", async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItemId = Number(req.params.cartItemID);

    const [[cartRow]] = await db.query(
      `SELECT c.userID
       FROM cartitem ci
       JOIN cart c ON ci.cartID = c.cartID
       WHERE ci.cartItemID = ?`,
      [cartItemId]
    );

    if (!cartRow) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (Number(req.user.userID) !== Number(cartRow.userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await db.query("UPDATE cartitem SET quantity = ? WHERE cartItemID = ?", [
      quantity,
      req.params.cartItemID,
    ]);

    res.json({ message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

app.delete("/api/cart/items/:cartItemID", async (req, res) => {
  try {
    const cartItemId = Number(req.params.cartItemID);
    const [[cartRow]] = await db.query(
      `SELECT c.userID
       FROM cartitem ci
       JOIN cart c ON ci.cartID = c.cartID
       WHERE ci.cartItemID = ?`,
      [cartItemId]
    );

    if (!cartRow) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (Number(req.user.userID) !== Number(cartRow.userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.query("DELETE FROM cartitem WHERE cartItemID = ?", [
      req.params.cartItemID,
    ]);

    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ─── ORDERS ───────────────────────────────────────────────
app.post("/api/orders", async (req, res) => {
  try {
    const { userID } = req.body;

    if (Number(req.user.userID) !== Number(userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!userID) {
      return res.status(400).json({ error: "userID is required" });
    }

    const [carts] = await db.query("SELECT cartID FROM cart WHERE userID = ?", [
      userID,
    ]);

    if (carts.length === 0) {
      return res.status(400).json({ error: "No cart found" });
    }

    const cartID = carts[0].cartID;

    const [items] = await db.query(
      `SELECT ci.partID, ci.quantity, s.price, s.stock, s.name
       FROM cartitem ci 
       JOIN sparepart s ON ci.partID = s.partID 
       WHERE ci.cartID = ?`,
      [cartID]
    );

    if (items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    for (const item of items) {
      if (item.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for "${item.name}"` });
      }
    }

    const orderNumber = await getNextUserOrderNumber(
      db,
      "sparepartsorder",
      userID
    );

    const [orderResult] = await db.query(
      "INSERT INTO sparepartsorder (userID, orderNumber, status, submittedAt) VALUES (?, ?, ?, NOW())",
      [userID, orderNumber, "pending"]
    );

    const sparePartsOrderID = orderResult.insertId;

    for (const item of items) {
      await db.query(
        "INSERT INTO orderitem (sparePartsOrderID, partID, quantity, unitPrice) VALUES (?, ?, ?, ?)",
        [sparePartsOrderID, item.partID, item.quantity, item.price]
      );

      await db.query("UPDATE sparepart SET stock = stock - ? WHERE partID = ?", [
        item.quantity,
        item.partID,
      ]);
    }

    await db.query("DELETE FROM cartitem WHERE cartID = ?", [cartID]);

    res.status(201).json({
      message: "Order submitted",
      orderID: sparePartsOrderID,
      orderNumber,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit order" });
  }
});

app.get("/api/orders/user/:userID", async (req, res) => {
  if (Number(req.user.userID) !== Number(req.params.userID) && !isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [orders] = await db.query(
      "SELECT sparePartsOrderID, orderNumber, status, submittedAt FROM sparepartsorder WHERE userID = ? AND status <> ? ORDER BY submittedAt DESC",
      [req.params.userID, "cancelled"]
    );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/:orderID", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT userID FROM sparepartsorder WHERE sparePartsOrderID = ?",
      [req.params.orderID]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (Number(req.user.userID) !== Number(orders[0].userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [orderDetails] = await db.query(
      "SELECT * FROM sparepartsorder WHERE sparePartsOrderID = ?",
      [req.params.orderID]
    );

    if (orderDetails.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const [items] = await db.query(
      `SELECT oi.itemID, oi.quantity, oi.unitPrice, s.partID, s.name
       FROM orderitem oi
       JOIN sparepart s ON oi.partID = s.partID
       WHERE oi.sparePartsOrderID = ?`,
      [req.params.orderID]
    );

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    res.json({ ...orders[0], items, total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

app.get("/api/warehouse/orders", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [rows] = await db.query(
      `SELECT
         spo.sparePartsOrderID,
         spo.orderNumber,
         spo.userID,
         spo.status,
         spo.submittedAt,
         spo.fulfilledAt,
         u.fName,
         u.lName,
         u.username,
         oi.itemID,
         oi.partID,
         oi.quantity,
         oi.unitPrice,
         sp.name AS partName
       FROM sparepartsorder spo
       JOIN user u ON u.userID = spo.userID
       LEFT JOIN orderitem oi ON oi.sparePartsOrderID = spo.sparePartsOrderID
       LEFT JOIN sparepart sp ON sp.partID = oi.partID
       WHERE spo.status <> ?
       ORDER BY spo.submittedAt DESC, spo.sparePartsOrderID DESC`,
      ["cancelled"]
    );

    const ordersById = new Map();

    for (const row of rows) {
      if (!ordersById.has(row.sparePartsOrderID)) {
        ordersById.set(row.sparePartsOrderID, {
          sparePartsOrderID: row.sparePartsOrderID,
          orderNumber: row.orderNumber,
          userID: row.userID,
          status: row.status,
          submittedAt: row.submittedAt,
          fulfilledAt: row.fulfilledAt,
          technician: {
            userID: row.userID,
            fName: row.fName,
            lName: row.lName,
            username: row.username,
          },
          items: [],
        });
      }

      if (row.itemID) {
        ordersById.get(row.sparePartsOrderID).items.push({
          itemID: row.itemID,
          partID: row.partID,
          name: row.partName,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
        });
      }
    }

    res.json(Array.from(ordersById.values()));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch warehouse orders" });
  }
});

app.patch("/api/warehouse/orders/:orderID/fulfill", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [orders] = await db.query(
      "SELECT sparePartsOrderID, status FROM sparepartsorder WHERE sparePartsOrderID = ?",
      [req.params.orderID]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orders[0].status === "completed") {
      return res.json({ message: "Order already fulfilled", status: "completed" });
    }

    await db.query(
      "UPDATE sparepartsorder SET status = ?, fulfilledAt = NOW() WHERE sparePartsOrderID = ?",
      ["completed", req.params.orderID]
    );

    res.json({ message: "Order fulfilled", status: "completed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fulfill order" });
  }
});

app.patch("/api/orders/:orderID/cancel", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT userID, status FROM sparepartsorder WHERE sparePartsOrderID = ?",
      [req.params.orderID]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (Number(req.user.userID) !== Number(orders[0].userID) && !isManager(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (orders[0].status !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending orders can be cancelled" });
    }

    const [items] = await db.query(
      "SELECT partID, quantity FROM orderitem WHERE sparePartsOrderID = ?",
      [req.params.orderID]
    );

    for (const item of items) {
      await db.query("UPDATE sparepart SET stock = stock + ? WHERE partID = ?", [
        item.quantity,
        item.partID,
      ]);
    }

    await db.query("DELETE FROM orderitem WHERE sparePartsOrderID = ?", [
      req.params.orderID,
    ]);

    await db.query("DELETE FROM sparepartsorder WHERE sparePartsOrderID = ?", [
      req.params.orderID,
    ]);

    res.json({ message: "Order cancelled and deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// ─── SERVER ───────────────────────────────────────────────
if (require.main === module) {
  app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log(
      `Server running on http://0.0.0.0:${process.env.PORT || 3000}`
    );
  });
}

module.exports = {
  app,
  normalizeRole,
  isManager,
  authenticateToken,
  allowRoles,
  authorizeUserAccess,
  normalizeSelectedParts,
  loadAndValidateSelectedParts,
  syncServiceOrderParts,
  getNextUserOrderNumber,
  ensureDefaultSpareParts,
  ensureServiceOrderPartsTable,
  findServiceOrder,
};

// ─── USERS (Manager) ──────────────────────────────────────

app.get("/users", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [rows] = await db.query(
      "SELECT userID, fName, lName, username, email, role FROM user ORDER BY userID ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { id } = req.params;
  const { fName, lName, username, email, role } = req.body;

  if (role && !["menadžer", "serviser", "skladištar"].includes(role)) {
    return res.status(400).json({ message: "Nevažeća uloga." });
  }

  try {
    const [[existing]] = await db.query("SELECT userID FROM user WHERE userID = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    if (username || email) {
      const [conflict] = await db.query(
        "SELECT userID FROM user WHERE (username = ? OR email = ?) AND userID != ?",
        [username || "", email || "", id]
      );
      if (conflict.length > 0) {
        return res.status(409).json({ message: "Korisničko ime ili email već postoji." });
      }
    }

    const updates = [];
    const params  = [];

    if (fName)    { updates.push("fName = ?");    params.push(fName.trim()); }
    if (lName)    { updates.push("lName = ?");    params.push(lName.trim()); }
    if (username) { updates.push("username = ?"); params.push(username.trim()); }
    if (email)    { updates.push("email = ?");    params.push(email.trim().toLowerCase()); }
    if (role)     { updates.push("role = ?");     params.push(role); }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nema podataka za ažuriranje." });
    }

    params.push(id);
    await db.query(`UPDATE user SET ${updates.join(", ")} WHERE userID = ? LIMIT 1`, params);

    const [[updated]] = await db.query(
      "SELECT userID, fName, lName, username, email, role FROM user WHERE userID = ?",
      [id]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { id } = req.params;
  try {
    const [[existing]] = await db.query("SELECT userID FROM user WHERE userID = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    // Delete related records first to avoid foreign key constraint errors
    await db.query("DELETE FROM cartitem WHERE cartID IN (SELECT cartID FROM cart WHERE userID = ?)", [id]);
    await db.query("DELETE FROM cart WHERE userID = ?", [id]);
    await db.query("DELETE FROM orderitem WHERE sparePartsOrderID IN (SELECT sparePartsOrderID FROM sparepartsorder WHERE userID = ?)", [id]);
    await db.query("DELETE FROM sparepartsorder WHERE userID = ?", [id]);
    await db.query("DELETE FROM financialrecord WHERE serviceOrderID IN (SELECT serviceOrderID FROM serviceorder WHERE userID = ?)", [id]);
    await db.query("DELETE FROM serviceorder WHERE userID = ?", [id]);

    await db.query("DELETE FROM user WHERE userID = ? LIMIT 1", [id]);
    res.json({ message: "Korisnik je obrisan." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { fName, lName, username, email, password, passwordHash, role } = req.body;

  if (!fName || !lName || !username || !email || !(password || passwordHash) || !role) {
    return res.status(400).json({ message: "Sva polja su obavezna." });
  }

  if (!["menadžer", "serviser", "skladištar"].includes(role)) {
    return res.status(400).json({ message: "Nevažeća uloga." });
  }

  try {
    const [existing] = await db.query(
      "SELECT userID FROM user WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Korisničko ime ili email već postoji." });
    }

    const storedPassword = passwordHash || (await bcrypt.hash(password, 10));

    const [result] = await db.query(
      "INSERT INTO user (fName, lName, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [fName.trim(), lName.trim(), username.trim(), email.trim().toLowerCase(), storedPassword, role]
    );

    res.status(201).json({
      userID:   result.insertId,
      fName:    fName.trim(),
      lName:    lName.trim(),
      username: username.trim(),
      email:    email.trim().toLowerCase(),
      role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/serviceorders", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT so.*, d.serialNumber, d.ownerName AS name, d.model AS location, 
       d.installDate AS date, f.amount AS totalAmount,
       u.fName, u.lName, u.username
       FROM serviceorder so
       LEFT JOIN device d ON so.deviceID = d.deviceID
       LEFT JOIN financialrecord f ON so.serviceOrderID = f.serviceOrderID
       LEFT JOIN user u ON so.userID = u.userID
       ORDER BY so.createdAt DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new spare part
app.post("/spareparts", async (req, res) => {
  const { name, description, price, stock } = req.body;
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: "Naziv, cijena i zaliha su obavezni." });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO sparepart (name, description, price, stock) VALUES (?, ?, ?, ?)",
      [name.trim(), description?.trim() || "", Number(price), Number(stock)]
    );
    res.status(201).json({ partID: result.insertId, name: name.trim(), description: description?.trim() || "", price: Number(price), stock: Number(stock) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update spare part
app.put("/spareparts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  try {
    const [[existing]] = await db.query("SELECT partID FROM sparepart WHERE partID = ?", [id]);
    if (!existing) return res.status(404).json({ message: "Dio nije pronađen." });

    const updates = [];
    const params  = [];
    if (name        !== undefined) { updates.push("name = ?");        params.push(name.trim()); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description.trim()); }
    if (price       !== undefined) { updates.push("price = ?");       params.push(Number(price)); }
    if (stock       !== undefined) { updates.push("stock = ?");       params.push(Number(stock)); }

    if (updates.length === 0) return res.status(400).json({ message: "Nema podataka za ažuriranje." });

    params.push(id);
    await db.query(`UPDATE sparepart SET ${updates.join(", ")} WHERE partID = ? LIMIT 1`, params);
    const [[updated]] = await db.query("SELECT * FROM sparepart WHERE partID = ?", [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/spareparts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[existing]] = await db.query("SELECT partID FROM sparepart WHERE partID = ?", [id]);
    if (!existing) return res.status(404).json({ message: "Dio nije pronađen." });

    // Remove from carts first
    await db.query("DELETE FROM cartitem WHERE partID = ?", [id]);

    // Remove from order items
    await db.query("DELETE FROM orderitem WHERE partID = ?", [id]);

    await db.query("DELETE FROM sparepart WHERE partID = ? LIMIT 1", [id]);
    res.json({ message: "Dio je obrisan." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
