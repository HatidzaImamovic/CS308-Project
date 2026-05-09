require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt'); // add this
const db = require('./database');
const app = express();

app.use(express.json());

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // fetch by username only, NOT password
    const [rows] = await db.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka' });
    }

    // compare entered password with the hash in DB
    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (isMatch) {
      res.json({ user: rows[0] });
    } else {
      res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/financial/:userID', async (req, res) => {
  try {
    const userID = req.params.userID;

    const query = `
      SELECT f.*
      FROM financialrecord f
      JOIN serviceorder s ON f.serviceOrderID = s.serviceOrderID
      WHERE s.userID = ?
    `;

    const [results] = await db.query(query, [userID]);


    res.json(results);

  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});