require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt"); // add this
const cors = require("cors");
const db = require("./database");
const app = express();

app.use(cors());
app.use(express.json());

// Test endpoint to verify connection
app.get("/test", (req, res) => {
  res.json({ message: "Backend is working!", timestamp: new Date() });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // fetch by username only, NOT password
    const [rows] = await db.query("SELECT * FROM user WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Pogrešno korisničko ime ili lozinka" });
    }

    // compare entered password with the hash in DB
    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (isMatch) {
      res.json({ user: rows[0] });
    } else {
      res.status(401).json({ message: "Pogrešno korisničko ime ili lozinka" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/spareparts", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sparepart");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/serviceorders/:userID", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT so.*, d.serialNumber, d.ownerName AS name, d.model AS location, d.installDate AS date
       FROM serviceorder so
       LEFT JOIN device d ON so.deviceID = d.deviceID
       WHERE so.userID = ?
       ORDER BY so.createdAt DESC`,
      [req.params.userID],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const findServiceOrder = async (id) => {
  const [[order]] = await db.query(
    `SELECT *
     FROM serviceorder
     WHERE serviceOrderID = ?
     LIMIT 1`,
    [id],
  );
  return order;
};

// Delete a service order by serviceOrderID.
app.delete("/serviceorders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await findServiceOrder(id);

    if (!existing) {
      return res.status(404).json({ message: "Servisni nalog nije pronaÄ‘en" });
    }

    const [result] = await db.query(
      "DELETE FROM serviceorder WHERE serviceOrderID = ? LIMIT 1",
      [existing.serviceOrderID],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    res.json({ message: "Servisni nalog je obrisan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing service order by serviceOrderID.
app.put("/serviceorders/:id", async (req, res) => {
  const { id } = req.params;
  const { serviceType, serialNumber, name, location, date, status } = req.body;

  const typeMap = {
    Instalacija: "installation",
    Popravak: "repair",
    Održavanje: "maintenance",
  };
  const typeValue = serviceType ? typeMap[serviceType] || serviceType : null;

  let normalizedStatus = null;
  if (status === 0 || status === "0" || status === "otvoren")
    normalizedStatus = 0;
  else if (status === 1 || status === "1" || status === "zatvoren")
    normalizedStatus = 1;

  try {
    // find existing order
    const existing = await findServiceOrder(id);

    if (!existing) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    let deviceID = existing.deviceID;

    if (serialNumber) {
      const [deviceRows] = await db.query(
        "SELECT deviceID FROM device WHERE serialNumber = ?",
        [serialNumber],
      );
      if (deviceRows.length > 0) {
        deviceID = deviceRows[0].deviceID;
      } else {
        const [deviceInsert] = await db.query(
          "INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)",
          [serialNumber, location || "", date || null, name || ""],
        );
        deviceID = deviceInsert.insertId;
      }

      await db.query(
        "UPDATE device SET model = ?, installDate = ?, ownerName = ? WHERE deviceID = ?",
        [location || "", date || null, name || "", deviceID],
      );
    }

    const newDesc = `Serial: ${serialNumber || ""}; Ime: ${name || ""}; Lokacija: ${location || ""}`;

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
    if (newDesc) {
      updates.push("description = ?");
      params.push(newDesc);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nema polja za ažuriranje" });
    }

    params.push(existing.serviceOrderID);

    const sql = `UPDATE serviceorder SET ${updates.join(", ")} WHERE serviceOrderID = ? LIMIT 1`;
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Servisni nalog nije pronađen za ažuriranje" });
    }

    res.json({ message: "Servisni nalog je ažuriran" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all service orders for a user (dangerous: dev helper)
app.delete("/serviceorders/user/:userID", async (req, res) => {
  const { userID } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM serviceorder WHERE userID = ?",
      [userID],
    );
    res.json({
      message: "Deleted service orders",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
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
  } = req.body;

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

  try {
    const [deviceRows] = await db.query(
      "SELECT deviceID FROM device WHERE serialNumber = ?",
      [serialNumber],
    );

    let deviceID;
    if (deviceRows.length > 0) {
      deviceID = deviceRows[0].deviceID;
      await db.query(
        "UPDATE device SET model = ?, installDate = ?, ownerName = ? WHERE deviceID = ?",
        [location, date, name, deviceID],
      );
    } else {
      const [deviceInsert] = await db.query(
        "INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)",
        [serialNumber, location, date, name],
      );
      deviceID = deviceInsert.insertId;
    }

    const description = `Serial: ${serialNumber}; Ime: ${name}; Lokacija: ${location}`;

    const [result] = await db.query(
      "INSERT INTO serviceorder (type, status, deviceID, userID, createdAt, description) VALUES (?, ?, ?, ?, NOW(), ?)",
      [typeValue, statusValue, deviceID, userID, description],
    );

    res.status(201).json({
      id: result.insertId,
      serviceOrderID: result.insertId,
      type: typeValue,
      status: statusValue,
      deviceID,
      userID,
      createdAt: new Date(),
      description,
    });
  } catch (err) {
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
      return res.status(404).json({ message: "Servisni nalog nije pronaÄ‘en" });
    }

    const [result] = await db.query(
      "UPDATE serviceorder SET status = ? WHERE serviceOrderID = ? LIMIT 1",
      [normalizedStatus, existing.serviceOrderID],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Servisni nalog nije pronađen" });
    }

    res.json({ message: "Status servisnog naloga je ažuriran", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${process.env.PORT || 3000}`);
});
