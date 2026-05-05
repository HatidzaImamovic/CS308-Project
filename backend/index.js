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
      "SELECT * FROM serviceorder WHERE userID = ? ORDER BY createdAt DESC",
      [req.params.userID],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/serviceorders", async (req, res) => {
  const { serviceType, serialNumber, name, location, date, userID } = req.body;

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

  try {
    const [deviceRows] = await db.query(
      "SELECT deviceID FROM device WHERE serialNumber = ?",
      [serialNumber],
    );

    let deviceID;
    if (deviceRows.length > 0) {
      deviceID = deviceRows[0].deviceID;
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
      [typeValue, 0, deviceID, userID, description],
    );

    res.status(201).json({
      id: result.insertId,
      type: typeValue,
      status: 0,
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

  // Validate status
  if (!["otvoren", "zatvoren"].includes(status)) {
    return res.status(400).json({
      message: "Nevažeći status. Dozvoljeni statusi: otvoren, zatvoren",
    });
  }

  try {
    const [result] = await db.query(
      "UPDATE serviceorder SET status = ? WHERE id = ?",
      [status, id],
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
