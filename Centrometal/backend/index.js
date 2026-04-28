require('dotenv').config();
const express = require('express');
const db = require('./database');
const app = express();

app.use(express.json());

app.get('/spareparts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sparepart');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/serviceorders/:userID', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM serviceorder WHERE userID = ?',
      [req.params.userID]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});
