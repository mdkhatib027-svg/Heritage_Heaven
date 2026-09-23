const express = require('express');
const db = require('../database');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, email, phone, date, time, visitors, message } = req.body;
  if (!name || !email || !date || !time)
    return res.status(400).json({ error: 'Missing required fields' });

  const result = db.prepare(`
    INSERT INTO appointments (name, email, phone, date, time, visitors, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, email, phone || null, date, time, visitors || 1, message || null);

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

module.exports = router;