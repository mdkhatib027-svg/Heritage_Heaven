const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Cart lives in localStorage on the client — orders are created at checkout
router.post('/', auth, (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const tx = db.transaction(() => {
    const orderResult = db.prepare(
      `INSERT INTO orders (userId, totalAmount, status, shippingAddress)
       VALUES (?, ?, 'Pending', ?)`
    ).run(req.user.id, total, shippingAddress || null);

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare(
      'INSERT INTO order_items (orderId, artifactId, price, quantity) VALUES (?, ?, ?, ?)'
    );
    items.forEach(i => insertItem.run(orderId, i.artifactId, i.price, i.quantity));

    // Mark one-of-one items as sold
    const markSold = db.prepare('UPDATE artifacts SET isForSale = 0 WHERE id = ?');
    items.forEach(i => markSold.run(i.artifactId));

    return orderId;
  });

  const orderId = tx();
  res.status(201).json({ orderId, total });
});

router.get('/', auth, (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC'
  ).all(req.user.id);

  const itemsStmt = db.prepare(`
    SELECT oi.*, a.title, a.imageUrl
    FROM order_items oi
    JOIN artifacts a ON a.id = oi.artifactId
    WHERE oi.orderId = ?
  `);

  orders.forEach(o => { o.items = itemsStmt.all(o.id); });
  res.json(orders);
});

module.exports = router;