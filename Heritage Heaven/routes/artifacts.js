const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/artifacts?category=&period=&origin=&sort=
router.get('/', (req, res) => {
  const { category, period, origin, sort, q } = req.query;
  let sql = 'SELECT * FROM artifacts WHERE 1=1';
  const params = [];

  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category); }
  if (period)  { sql += ' AND period = ?';   params.push(period); }
  if (origin)  { sql += ' AND origin LIKE ?'; params.push(`%${origin}%`); }
  if (q)       { sql += ' AND title LIKE ?';  params.push(`%${q}%`); }

  switch (sort) {
    case 'Newest':       sql += ' ORDER BY createdDate DESC'; break;
    case 'PriceLowHigh': sql += ' ORDER BY price ASC'; break;
    case 'PriceHighLow': sql += ' ORDER BY price DESC'; break;
    default:             sql += ' ORDER BY isFeatured DESC, createdDate DESC';
  }

  res.json(db.prepare(sql).all(...params));
});

// GET /api/artifacts/featured
router.get('/featured', (req, res) => {
  const limit = Number(req.query.limit) || 8;
  res.json(db.prepare(
    'SELECT * FROM artifacts WHERE isFeatured = 1 ORDER BY createdDate DESC LIMIT ?'
  ).all(limit));
});

// GET /api/artifacts/:id
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Artifact not found' });
  res.json(item);
});

// POST /api/artifacts (admin)
router.post('/', auth, adminOnly, (req, res) => {
  const a = req.body;
  const result = db.prepare(`
    INSERT INTO artifacts
      (title, artist, category, period, origin, yearCreated, material, price,
       imageUrl, description, dimensions, condition, provenance, isForSale, isFeatured)
    VALUES (@title, @artist, @category, @period, @origin, @yearCreated, @material, @price,
            @imageUrl, @description, @dimensions, @condition, @provenance, @isForSale, @isFeatured)
  `).run({
    title: a.title, artist: a.artist || null, category: a.category,
    period: a.period || null, origin: a.origin || null,
    yearCreated: a.yearCreated || null, material: a.material || null,
    price: a.price, imageUrl: a.imageUrl || null,
    description: a.description || null, dimensions: a.dimensions || null,
    condition: a.condition || null, provenance: a.provenance || null,
    isForSale: a.isForSale ? 1 : 0, isFeatured: a.isFeatured ? 1 : 0
  });
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/artifacts/:id (admin)
router.put('/:id', auth, adminOnly, (req, res) => {
  const a = req.body;
  db.prepare(`
    UPDATE artifacts SET title=@title, artist=@artist, category=@category,
      period=@period, origin=@origin, yearCreated=@yearCreated, material=@material,
      price=@price, imageUrl=@imageUrl, description=@description,
      dimensions=@dimensions, condition=@condition, provenance=@provenance,
      isForSale=@isForSale, isFeatured=@isFeatured
    WHERE id=@id
  `).run({ ...a, id: req.params.id, isForSale: a.isForSale ? 1 : 0, isFeatured: a.isFeatured ? 1 : 0 });
  res.json({ success: true });
});

// DELETE /api/artifacts/:id (admin)
router.delete('/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM artifacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;