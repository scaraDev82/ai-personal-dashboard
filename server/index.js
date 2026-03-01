const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Panels API
app.get('/api/panels', (req, res) => {
  const panels = db.prepare('SELECT * FROM panels ORDER BY display_order ASC').all();
  res.json(panels);
});

app.post('/api/panels', (req, res) => {
  const { name } = req.body;
  const result = db.prepare('INSERT INTO panels (name, display_order) VALUES (?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM panels))').run(name);
  res.json({ id: result.lastInsertRowid, name });
});

app.put('/api/panels/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.prepare('UPDATE panels SET name = ? WHERE id = ?').run(name, id);
  res.json({ id, name });
});

app.delete('/api/panels/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM panels WHERE id = ?').run(id);
  res.json({ success: true });
});

// Categories API
app.get('/api/categories', (req, res) => {
  const { panel_id } = req.query;
  const categories = panel_id 
    ? db.prepare('SELECT * FROM categories WHERE panel_id = ? ORDER BY display_order ASC').all(panel_id)
    : db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const { panel_id, name } = req.body;
  const result = db.prepare('INSERT INTO categories (panel_id, name, display_order) VALUES (?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories))').run(panel_id, name);
  res.json({ id: result.lastInsertRowid, panel_id, name });
});

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/categories/reorder', (req, res) => {
  const { categories } = req.body;
  const update = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
  const transaction = db.transaction((items) => {
    for (const item of items) update.run(item.display_order, item.id);
  });
  transaction(categories);
  res.json({ success: true });
});

// Links API
app.get('/api/links', (req, res) => {
  const links = db.prepare('SELECT * FROM links ORDER BY display_order ASC').all();
  res.json(links);
});

app.post('/api/links', (req, res) => {
  const { category_id, name, url } = req.body;
  const result = db.prepare('INSERT INTO links (category_id, name, url, display_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM links))').run(category_id, name, url);
  res.json({ id: result.lastInsertRowid, category_id, name, url });
});

app.put('/api/links/:id', (req, res) => {
  const { category_id, name, url } = req.body;
  db.prepare('UPDATE links SET category_id = ?, name = ?, url = ? WHERE id = ?').run(category_id, name, url, req.params.id);
  res.json({ id: req.params.id, category_id, name, url });
});

app.delete('/api/links/:id', (req, res) => {
  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/links/reorder', (req, res) => {
  const { links } = req.body;
  const update = db.prepare('UPDATE links SET display_order = ?, category_id = ? WHERE id = ?');
  const transaction = db.transaction((items) => {
    for (const item of items) update.run(item.display_order, item.category_id, item.id);
  });
  transaction(links);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
