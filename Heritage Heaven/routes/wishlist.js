const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const items = db.prepare(`
    SELECT w.id AS wishlistId, w.artifactId, w.createdDate,
           a.title, a.price, a.imageUrl, a.isForSale, a.category, a.period
    FROM wishlist w
    JOIN artifacts a ON a.id = w.artifactId
    WHERE w.userId = ?
    ORDER BY w.createdDate DESC
  `).all(req.user.id);
  res.json(items);
});

router.post('/:artifactId', auth, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO wishlist (userId, artifactId) VALUES (?, ?)')
      .run(req.user.id, req.params.artifactId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:artifactId', auth, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE userId = ? AND artifactId = ?')
    .run(req.user.id, req.params.artifactId);
  res.json({ success: true });
});

module.exports = router;