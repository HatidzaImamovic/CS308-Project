require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');
const app = express();

app.use(express.json());

// ─── AUTH ─────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka' });
    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (isMatch) { res.json({ user: rows[0] }); }
    else { res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka' }); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SPARE PARTS ──────────────────────────────────────────
app.get('/spareparts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sparepart');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/serviceorders/:userID', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM serviceorder WHERE userID = ?', [req.params.userID]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CART ─────────────────────────────────────────────────
app.get('/api/cart/:userID', async (req, res) => {
  try {
    const { userID } = req.params;
    const [existing] = await db.query('SELECT cartID FROM cart WHERE userID = ?', [userID]);
    let cartID;
    if (existing.length > 0) {
      cartID = existing[0].cartID;
    } else {
      const [result] = await db.query('INSERT INTO cart (userID, createdAt) VALUES (?, NOW())', [userID]);
      cartID = result.insertId;
    }
    const [items] = await db.query(
      `SELECT ci.cartItemID, ci.quantity, s.partID, s.name, s.description, s.price, s.stock
       FROM cartitem ci JOIN sparepart s ON ci.partID = s.partID
       WHERE ci.cartID = ?`, [cartID]
    );
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ cartID, items, total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch cart' }); }
});

app.post('/api/cart/:userID/items', async (req, res) => {
  try {
    const { userID } = req.params;
    const { partID, quantity = 1 } = req.body;
    if (!partID) return res.status(400).json({ error: 'partID is required' });

    const [parts] = await db.query('SELECT stock FROM sparepart WHERE partID = ?', [partID]);
    if (parts.length === 0) return res.status(404).json({ error: 'Part not found' });
    if (parts[0].stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    const [existing] = await db.query('SELECT cartID FROM cart WHERE userID = ?', [userID]);
    let cartID;
    if (existing.length > 0) { cartID = existing[0].cartID; }
    else {
      const [result] = await db.query('INSERT INTO cart (userID, createdAt) VALUES (?, NOW())', [userID]);
      cartID = result.insertId;
    }

    const [cartItem] = await db.query(
      'SELECT cartItemID, quantity FROM cartitem WHERE cartID = ? AND partID = ?', [cartID, partID]
    );
    if (cartItem.length > 0) {
      await db.query('UPDATE cartitem SET quantity = ? WHERE cartItemID = ?',
        [cartItem[0].quantity + quantity, cartItem[0].cartItemID]);
    } else {
      await db.query('INSERT INTO cartitem (cartID, partID, quantity) VALUES (?, ?, ?)', [cartID, partID, quantity]);
    }
    res.json({ message: 'Item added to cart' });
  } catch (err) { res.status(500).json({ error: 'Failed to add item to cart' }); }
});

app.put('/api/cart/items/:cartItemID', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
    await db.query('UPDATE cartitem SET quantity = ? WHERE cartItemID = ?', [quantity, req.params.cartItemID]);
    res.json({ message: 'Quantity updated' });
  } catch (err) { res.status(500).json({ error: 'Failed to update quantity' }); }
});

app.delete('/api/cart/items/:cartItemID', async (req, res) => {
  try {
    await db.query('DELETE FROM cartitem WHERE cartItemID = ?', [req.params.cartItemID]);
    res.json({ message: 'Item removed' });
  } catch (err) { res.status(500).json({ error: 'Failed to remove item' }); }
});

// ─── ORDERS ───────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) return res.status(400).json({ error: 'userID is required' });

    const [carts] = await db.query('SELECT cartID FROM cart WHERE userID = ?', [userID]);
    if (carts.length === 0) return res.status(400).json({ error: 'No cart found' });
    const cartID = carts[0].cartID;

    const [items] = await db.query(
      `SELECT ci.partID, ci.quantity, s.price, s.stock, s.name
       FROM cartitem ci JOIN sparepart s ON ci.partID = s.partID WHERE ci.cartID = ?`, [cartID]
    );
    if (items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of items) {
      if (item.stock < item.quantity)
        return res.status(400).json({ error: `Not enough stock for "${item.name}"` });
    }

    const [orderResult] = await db.query(
      'INSERT INTO sparepartsorder (userID, status, submittedAt) VALUES (?, ?, NOW())', [userID, 'pending']
    );
    const sparePartsOrderID = orderResult.insertId;

    for (const item of items) {
      await db.query(
        'INSERT INTO orderitem (sparePartsOrderID, partID, quantity, unitPrice) VALUES (?, ?, ?, ?)',
        [sparePartsOrderID, item.partID, item.quantity, item.price]
      );
      await db.query('UPDATE sparepart SET stock = stock - ? WHERE partID = ?', [item.quantity, item.partID]);
    }

    await db.query('DELETE FROM cartitem WHERE cartID = ?', [cartID]);
    res.status(201).json({ message: 'Order submitted', orderID: sparePartsOrderID });
  } catch (err) { res.status(500).json({ error: 'Failed to submit order' }); }
});

app.get('/api/orders/user/:userID', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT sparePartsOrderID, status, submittedAt FROM sparepartsorder WHERE userID = ? ORDER BY submittedAt DESC',
      [req.params.userID]
    );
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

app.get('/api/orders/:orderID', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM sparepartsorder WHERE sparePartsOrderID = ?', [req.params.orderID]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.query(
      `SELECT oi.itemID, oi.quantity, oi.unitPrice, s.partID, s.name
       FROM orderitem oi JOIN sparepart s ON oi.partID = s.partID
       WHERE oi.sparePartsOrderID = ?`, [req.params.orderID]
    );
    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    res.json({ ...orders[0], items, total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

app.patch('/api/orders/:orderID/cancel', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT status FROM sparepartsorder WHERE sparePartsOrderID = ?', [req.params.orderID]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (orders[0].status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

    const [items] = await db.query('SELECT partID, quantity FROM orderitem WHERE sparePartsOrderID = ?', [req.params.orderID]);
    for (const item of items) {
      await db.query('UPDATE sparepart SET stock = stock + ? WHERE partID = ?', [item.quantity, item.partID]);
    }
    await db.query('UPDATE sparepartsorder SET status = ? WHERE sparePartsOrderID = ?', ['cancelled', req.params.orderID]);
    res.json({ message: 'Order cancelled' });
  } catch (err) { res.status(500).json({ error: 'Failed to cancel order' }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running on port 3000'));