const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'dashboard.db'));
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    panel_id INTEGER,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (panel_id) REFERENCES panels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`);

// Seed initial data if empty
const panelCount = db.prepare('SELECT COUNT(*) as count FROM panels').get();
if (panelCount.count === 0) {
  const insertPanel = db.prepare('INSERT INTO panels (name, display_order) VALUES (?, ?)');
  const insertCategory = db.prepare('INSERT INTO categories (panel_id, name, display_order) VALUES (?, ?, ?)');
  const insertLink = db.prepare('INSERT INTO links (category_id, name, url, display_order) VALUES (?, ?, ?, ?)');

  const mainPanel = insertPanel.run('PRIMARY', 1).lastInsertRowid;
  
  const devCat = insertCategory.run(mainPanel, 'DEVELOPMENT', 1).lastInsertRowid;
  const toolsCat = insertCategory.run(mainPanel, 'TOOLS', 2).lastInsertRowid;

  insertLink.run(devCat, 'GitHub', 'https://github.com', 1);
  insertLink.run(devCat, 'Vercel', 'https://vercel.com', 2);
  insertLink.run(toolsCat, 'Excalidraw', 'https://excalidraw.com', 1);
}

module.exports = db;
