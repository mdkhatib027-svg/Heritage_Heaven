const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    `INSERT INTO users (name, email, phone, passwordHash, role)
     VALUES (?, ?, ?, ?, 'Customer')`
  ).run(name, email, phone || null, hash);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, role: 'Customer', name },
    process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, role: 'Customer' } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, role, createdDate FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

module.exports = router;