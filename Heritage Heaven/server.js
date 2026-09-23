require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/artifacts', require('./routes/artifacts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/appointments', require('./routes/appointments'));

// 404 for unmatched /api
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Fallback: serve index.html
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✓ Heritage Heaven server running at http://localhost:${PORT}`));