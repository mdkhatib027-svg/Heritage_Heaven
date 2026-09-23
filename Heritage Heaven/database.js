const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'data', 'heritage.db'));
db.pragma('journal_mode = WAL');

// --- Schema ---
db.exec(`
CREATE TABLE IF NOT EXISTS artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT,
  category TEXT NOT NULL,
  period TEXT,
  origin TEXT,
  yearCreated INTEGER,
  material TEXT,
  price REAL NOT NULL,
  imageUrl TEXT,
  description TEXT,
  dimensions TEXT,
  condition TEXT,
  provenance TEXT,
  isForSale INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  createdDate TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT DEFAULT 'Customer',
  createdDate TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  artifactId INTEGER NOT NULL,
  createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, artifactId),
  FOREIGN KEY(userId) REFERENCES users(id),
  FOREIGN KEY(artifactId) REFERENCES artifacts(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  orderDate TEXT DEFAULT CURRENT_TIMESTAMP,
  totalAmount REAL NOT NULL,
  status TEXT DEFAULT 'Pending',
  shippingAddress TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  artifactId INTEGER NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY(orderId) REFERENCES orders(id),
  FOREIGN KEY(artifactId) REFERENCES artifacts(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date TEXT,
  time TEXT,
  visitors INTEGER DEFAULT 1,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  createdDate TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifactId INTEGER,
  userId INTEGER,
  name TEXT,
  email TEXT,
  message TEXT,
  type TEXT,
  status TEXT DEFAULT 'Pending',
  createdDate TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// --- Seed admin ---
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?')
  .get(process.env.ADMIN_EMAIL || 'admin@heritageheaven.in');

if (!adminExists) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  db.prepare(`INSERT INTO users (name, email, phone, passwordHash, role)
              VALUES (?, ?, ?, ?, 'Admin')`)
    .run('Administrator', process.env.ADMIN_EMAIL || 'admin@heritageheaven.in',
         '+91 98765 43210', hash);
  console.log('✓ Admin user seeded');
}

// --- Seed artifacts ---
const count = db.prepare('SELECT COUNT(*) AS c FROM artifacts').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO artifacts
      (title, artist, category, period, origin, yearCreated, material, price,
       imageUrl, description, dimensions, condition, provenance, isForSale, isFeatured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const items = [
    ['Victorian Rosewood Writing Desk', null, 'Furniture', 'Late 19th Century',
     'British Colonial India', 1885, 'Rosewood / Brass', 185000,
     'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600',
     'A beautifully preserved Victorian-era writing desk with brass fittings.',
     '120 × 65 × 78 cm', 'Professionally restored', 'Private collection, Mumbai', 1],

    ['Anglo-Indian Carved Teak Cabinet', null, 'Furniture', 'Late 19th Century',
     'India', 1890, 'Teak', 240000,
     'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600',
     'Intricately carved teak cabinet with brass inlay.',
     '150 × 60 × 180 cm', 'Excellent', 'Estate of a Parsi family, Bombay', 1],

    ['French Bronze Mantel Clock', null, 'Clocks', 'Early 20th Century',
     'France', 1910, 'Bronze', 95000,
     'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600',
     'Ornate French mantel clock with mechanical movement.',
     '35 × 20 × 45 cm', 'Fully functional', 'Inherited from a French collector', 1],

    ['Mughal-Inspired Brass Urn', null, 'Decor', '19th Century',
     'India', 1870, 'Brass', 68000,
     'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600',
     'Hand-engraved brass urn with floral motifs.',
     '40 × 40 × 60 cm', 'Original patina', 'Royal household, Rajasthan', 1],

    ['Antique Persian Style Mirror', null, 'Decor', 'Early 20th Century',
     'Persia', 1915, 'Wood / Glass', 125000,
     'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600',
     'Carved wooden frame with original mirror glass.',
     '80 × 5 × 150 cm', 'Excellent', 'Private collection, Tehran', 1],

    ['Colonial Teakwood Armchair', null, 'Furniture', '19th Century',
     'British Colonial India', 1875, 'Teak / Cane', 78000,
     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
     'Classic colonial armchair with cane back and seat.',
     '60 × 65 × 95 cm', 'Restored', 'Estate sale, Kolkata', 1],

    ['Hand-Painted Porcelain Vase', null, 'Ceramics', '19th Century',
     'China', 1860, 'Porcelain', 54000,
     'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600',
     'Hand-painted porcelain vase with intricate floral motifs.',
     '30 × 30 × 45 cm', 'Excellent', 'Private collector, Hong Kong', 1],

    ['Vintage Mechanical Desk Clock', null, 'Clocks', 'Early 20th Century',
     'Switzerland', 1925, 'Brass / Glass', 42000,
     'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600',
     'Compact mechanical desk clock with original movement.',
     '15 × 10 × 18 cm', 'Fully functional', 'Inherited from a Swiss family', 1]
  ];

  const tx = db.transaction(() => {
    items.forEach(i => insert.run(...i));
  });
  tx();
  console.log(`✓ Seeded ${items.length} artifacts`);
}

module.exports = db;