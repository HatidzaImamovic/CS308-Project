require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// --- Auth ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (isMatch) {
      res.json({ user: rows[0] });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Spare Parts ---
app.get('/spareparts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sparepart');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Service Orders ---
const statusLabels = {
  0: 'Na cekanju',
  1: 'U toku',
  2: 'Zavrsen',
  3: 'Otkazan',
};
const serialPattern = /^SN-\d{3,}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeServiceOrderPayload = (body) => ({
  type: body.type,
  serialNumber: body.serialNumber?.trim().toUpperCase(),
  description: body.description?.trim(),
  createdAt: body.createdAt,
  userID: body.userID,
  status: body.status,
});

app.get('/serviceorders/:userID', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        so.serviceOrderID,
        so.type,
        so.status,
        so.createdAt,
        so.userID,
        so.description,
        d.deviceID,
        d.serialNumber,
        d.model
      FROM serviceorder so
      LEFT JOIN device d ON so.deviceID = d.deviceID
      WHERE so.userID = ?
      ORDER BY so.createdAt DESC, so.serviceOrderID DESC`,
      [req.params.userID]
    );
    res.json(rows.map((row) => ({
      ...row,
      statusLabel: statusLabels[row.status] || 'Na cekanju',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/serviceorders', async (req, res) => {
  const { type, serialNumber, description, createdAt, userID } = normalizeServiceOrderPayload(req.body);
  if (!type || !serialNumber || !description || !userID) {
    return res.status(400).json({ message: 'type, serialNumber, description and userID are required' });
  }
  if (!serialPattern.test(serialNumber)) {
    return res.status(400).json({ message: 'serialNumber must use format SN-001' });
  }
  if (createdAt && !datePattern.test(createdAt)) {
    return res.status(400).json({ message: 'createdAt must use format YYYY-MM-DD' });
  }
  try {
    const [existingDevices] = await db.query(
      'SELECT deviceID FROM device WHERE serialNumber = ? LIMIT 1',
      [serialNumber]
    );

    let deviceID = existingDevices[0]?.deviceID;
    if (!deviceID) {
      const [deviceResult] = await db.query(
        'INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)',
        [serialNumber, 'Unknown', new Date().toISOString().split('T')[0], 'Unknown']
      );
      deviceID = deviceResult.insertId;
    }

    const [result] = await db.query(
      'INSERT INTO serviceorder (type, status, deviceID, createdAt, userID, description) VALUES (?, ?, ?, ?, ?, ?)',
      [type, 0, deviceID, createdAt || new Date(), userID, description]
    );
    res.status(201).json({ serviceOrderID: result.insertId, message: 'Created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/serviceorders/:serviceOrderID', async (req, res) => {
  const { type, serialNumber, description, status, createdAt } = normalizeServiceOrderPayload(req.body);
  if (!type || !serialNumber || !description) {
    return res.status(400).json({ message: 'type, serialNumber and description are required' });
  }
  if (!serialPattern.test(serialNumber)) {
    return res.status(400).json({ message: 'serialNumber must use format SN-001' });
  }
  if (createdAt && !datePattern.test(createdAt)) {
    return res.status(400).json({ message: 'createdAt must use format YYYY-MM-DD' });
  }
  try {
    const [existingDevices] = await db.query(
      'SELECT deviceID FROM device WHERE serialNumber = ? LIMIT 1',
      [serialNumber]
    );

    let deviceID = existingDevices[0]?.deviceID;
    if (!deviceID) {
      const [deviceResult] = await db.query(
        'INSERT INTO device (serialNumber, model, installDate, ownerName) VALUES (?, ?, ?, ?)',
        [serialNumber, 'Unknown', new Date().toISOString().split('T')[0], 'Unknown']
      );
      deviceID = deviceResult.insertId;
    }

    await db.query(
      'UPDATE serviceorder SET type = ?, status = ?, deviceID = ?, createdAt = ?, description = ? WHERE serviceOrderID = ?',
      [type, Number(status ?? 0), deviceID, createdAt || new Date(), description, req.params.serviceOrderID]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/serviceorders/:serviceOrderID', async (req, res) => {
  try {
    await db.query('DELETE FROM serviceorder WHERE serviceOrderID = ?', [req.params.serviceOrderID]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});
