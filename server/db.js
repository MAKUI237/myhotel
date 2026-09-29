const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const { ensurePmsSchema } = require('./pms-schema');
const { seedPms } = require('./pms-seed');

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'myhotel-data') : path.join(__dirname, 'data');
const DB_FILE = process.env.MYHOTEL_SQLITE_PATH || path.join(DATA_DIR, 'myhotel.sqlite');
const LEGACY_DB = path.join(__dirname, '..', 'backend', 'data', 'myhotel.sqlite');

let db;
let persistTimer;

function persist() {
  if (!db) return;
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const bytes = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(bytes));
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 80);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

function run(sql, params = []) {
  db.run(sql, params);
  schedulePersist();
  return db.getRowsModified();
}

function lastId() {
  return Number(get('SELECT last_insert_rowid() AS id').id);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith('$2')) {
    return bcrypt.compareSync(password, stored.replace(/^\$2y\$/, '$2a$'));
  }
  const [algo, salt, hash] = String(stored).split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: Number(user.id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone ?? null,
    created_at: user.created_at,
    last_login: user.last_login ?? null,
    photo: user.photo ?? null,
    role: user.role ?? 'client',
  };
}

function ensureSchema() {
  db.run('PRAGMA foreign_keys = ON');
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      floor INTEGER NOT NULL,
      status TEXT NOT NULL,
      price_night REAL NOT NULL,
      capacity INTEGER NOT NULL,
      photo TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS room_equipment (
      room_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      PRIMARY KEY (room_id, equipment_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT NOT NULL,
      hired_at TEXT NOT NULL,
      photo TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      photo TEXT,
      available INTEGER NOT NULL DEFAULT 1
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      nationality TEXT,
      notes TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      status TEXT NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      icon TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      label TEXT NOT NULL
    )
  `);
}

function seedIfEmpty() {
  const roomsCount = Number(get('SELECT COUNT(*) AS n FROM rooms').n);
  if (roomsCount > 0) return;

  const equipment = [
    ['Lit king size', 'Literie', 'bed', 18],
    ['Lit queen size', 'Literie', 'bed', 10],
    ['Canapé-lit', 'Literie', 'bed', 6],
    ['Télévision 55"', 'Électronique', 'tv', 22],
    ['Wi-Fi haut débit', 'Électronique', 'wifi', 40],
    ['Climatisation', 'Confort', 'wind', 24],
    ['Minibar', 'Confort', 'fridge', 16],
    ['Cafetière Nespresso', 'Confort', 'coffee', 20],
    ['Coffre-fort', 'Sécurité', 'lock-alt', 18],
    ['Bureau & chaise', 'Mobilier', 'briefcase', 22],
    ['Armoire dressing', 'Mobilier', 'cabinet', 20],
    ['Baignoire', 'Salle de bain', 'bath', 8],
    ['Douche à l’italienne', 'Salle de bain', 'shower', 16],
    ['Articles de toilette', 'Salle de bain', 'droplet', 28],
    ['Balcon', 'Espace', 'door-open', 9],
    ['Vue mer / ville', 'Espace', 'map', 7],
  ];

  for (const row of equipment) {
    run(
      'INSERT INTO equipment (name, category, icon, quantity) VALUES (?, ?, ?, ?)',
      row,
    );
  }

  const rooms = [
    ['101', 'Standard', 1, 'disponible', 45000, 2, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80', 'Chambre standard meublée, idéale pour un séjour d’affaires.'],
    ['102', 'Standard', 1, 'occupee', 45000, 2, 'https://images.unsplash.com/photo-1566665797739-1674d7ff7f1c?w=1200&q=80', 'Chambre cosy avec bureau, TV et salle d’eau complète.'],
    ['103', 'Deluxe', 1, 'disponible', 72000, 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80', 'Deluxe lumineuse, minibar, climatisation et dressing.'],
    ['105', 'Standard', 1, 'occupee', 45000, 2, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80', 'Chambre standard avec vue cour intérieure.'],
    ['106', 'Deluxe', 1, 'disponible', 72000, 3, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80', 'Deluxe familiale, canapé-lit et espace détente.'],
    ['201', 'Suite', 2, 'occupee', 125000, 3, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80', 'Suite junior avec salon, baignoire et coffre-fort.'],
    ['202', 'Deluxe', 2, 'nettoyage', 72000, 2, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80', 'Deluxe en remise en état après départ.'],
    ['203', 'Familiale', 2, 'disponible', 98000, 4, 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200&q=80', 'Chambre familiale, deux lits et coin salon.'],
    ['301', 'Présidentielle', 3, 'disponible', 210000, 2, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80', 'Suite présidentielle, salon, baignoire et vue panoramique.'],
    ['302', 'Standard', 3, 'maintenance', 45000, 2, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80', 'Chambre temporairement fermée pour maintenance.'],
    ['303', 'Deluxe', 3, 'reservee', 72000, 2, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 'Deluxe réservée pour une arrivée en soirée.'],
    ['304', 'Suite', 3, 'disponible', 125000, 3, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80', 'Suite avec balcon, minibar et espace bureau.'],
  ];

  for (const row of rooms) {
    run(
      'INSERT INTO rooms (number, type, floor, status, price_night, capacity, photo, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      row,
    );
  }

  const roomEquip = {
    101: [1, 4, 5, 6, 10, 11, 13, 14],
    102: [2, 4, 5, 6, 10, 13, 14],
    103: [1, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14],
    105: [2, 4, 5, 6, 10, 13],
    106: [1, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14],
    201: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
    202: [1, 4, 5, 6, 7, 8, 10, 11, 13],
    203: [1, 2, 3, 4, 5, 6, 8, 10, 11, 13, 14],
    301: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16],
    302: [2, 4, 5, 10, 13],
    303: [1, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14],
    304: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15],
  };

  const roomRows = all('SELECT id, number FROM rooms');
  for (const room of roomRows) {
    const ids = roomEquip[Number(room.number)] || [];
    for (const equipmentId of ids) {
      run('INSERT OR IGNORE INTO room_equipment (room_id, equipment_id) VALUES (?, ?)', [
        room.id,
        equipmentId,
      ]);
    }
  }

  const staff = [
    ['Amina Koffi', 'Réceptionniste', 'Réception', '+225 07 00 11 22', 'amina@myhotel.ci', 'actif', '2022-03-12', 'Amina+Koffi'],
    ['Jean-Marc Yao', 'Manager d’hôtel', 'Direction', '+225 07 00 33 44', 'jeanmarc@myhotel.ci', 'actif', '2019-08-01', 'Jean-Marc+Yao'],
    ['Fatou Diarra', 'Gouvernante', 'Étages', '+225 05 22 10 18', 'fatou@myhotel.ci', 'actif', '2021-01-20', 'Fatou+Diarra'],
    ['Koffi Mensah', 'Agent d’étage', 'Étages', '+225 05 18 40 21', 'koffi@myhotel.ci', 'actif', '2023-06-05', 'Koffi+Mensah'],
    ['Sarah N’Guessan', 'Chef de cuisine', 'Restauration', '+225 01 44 20 09', 'sarah@myhotel.ci', 'actif', '2020-11-15', 'Sarah+NGuessan'],
    ['Ibrahim Traoré', 'Serveur', 'Restauration', '+225 07 55 12 90', 'ibrahim@myhotel.ci', 'conge', '2024-02-01', 'Ibrahim+Traore'],
    ['Lucie Bamba', 'Comptable', 'Administration', '+225 27 22 45 10', 'lucie@myhotel.ci', 'actif', '2018-04-09', 'Lucie+Bamba'],
    ['Paul Kouassi', 'Technicien', 'Maintenance', '+225 05 90 12 33', 'paul@myhotel.ci', 'actif', '2021-09-18', 'Paul+Kouassi'],
    ['Marie Adjoua', 'Spa thérapeute', 'Bien-être', '+225 07 13 88 41', 'marie@myhotel.ci', 'actif', '2023-01-11', 'Marie+Adjoua'],
    ['Eric Zongo', 'Bagagiste', 'Réception', '+225 01 20 77 65', 'eric@myhotel.ci', 'arret', '2024-07-22', 'Eric+Zongo'],
  ];

  for (const row of staff) {
    const photo = `https://ui-avatars.com/api/?name=${row[7]}&background=141622&color=D4AF37&size=256&bold=true`;
    run(
      'INSERT INTO staff (full_name, role, department, phone, email, status, hired_at, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [...row.slice(0, 7), photo],
    );
  }

  const dishes = [
    ['Pain perdu à la vanille', 'Petit-déjeuner', 6500, 'Brioche dorée, fruits de saison et miel local.', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=900&q=80'],
    ['Omelette du chef', 'Petit-déjeuner', 5500, 'Œufs fermiers, fromage, tomates et fines herbes.', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&q=80'],
    ['Salade d’avocat', 'Entrée', 7000, 'Avocat, crevettes, agrumes et vinaigrette passion.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80'],
    ['Soupe de poisson', 'Entrée', 8000, 'Bouillon iodé, piment doux et croûtons.', 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=900&q=80'],
    ['Poulet braisé attiéké', 'Plat', 12500, 'Poulet grillé, attiéké, piment et oignons.', 'https://images.unsplash.com/photo-1532550907401-a532c00947da?w=900&q=80'],
    ['Filet de capitaine', 'Plat', 16000, 'Poisson entier, légumes vapeur et beurre citronné.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&q=80'],
    ['Risotto aux champignons', 'Plat', 14000, 'Arborio crémeux, parmesan et thym.', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=900&q=80'],
    ['Tarte chocolat', 'Dessert', 5500, 'Ganache noire et éclats de cacao.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=80'],
    ['Ananas flambé', 'Dessert', 5000, 'Ananas rôti, vanille et glace vanille.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900&q=80'],
    ['Jus bissap', 'Boisson', 2500, 'Hibiscus frais, menthe et gingembre.', 'https://images.unsplash.com/photo-1546173159-315724a31696?w=900&q=80'],
    ['Café MyHotel', 'Boisson', 2000, 'Espresso ou allongé, grains torréfiés sur place.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80'],
    ['Cocktail Coco Sunset', 'Boisson', 6000, 'Coco, ananas, citron vert et sirop de canne.', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=900&q=80'],
  ];

  for (const row of dishes) {
    run(
      'INSERT INTO menu_items (name, category, price, description, photo, available) VALUES (?, ?, ?, ?, ?, 1)',
      row,
    );
  }

  const guests = [
    ['Claire Dubois', 'claire.dubois@mail.com', '+33 6 12 45 90', 'France', 'Cliente régulière, préfère étage élevé.'],
    ['Kwame Asante', 'kwame.asante@mail.com', '+233 24 111 222', 'Ghana', 'Voyage d’affaires, départ tôt.'],
    ['Nadia El Mansouri', 'nadia.em@mail.com', '+212 6 88 21 10', 'Maroc', 'Allergie gluten.'],
    ['Thomas Berger', 'thomas.berger@mail.com', '+41 79 330 12', 'Suisse', 'Demande parking.'],
    ['Aïcha Koné', 'aicha.kone@mail.com', '+225 07 19 44 20', 'Côte d’Ivoire', 'Anniversaire le 2e soir.'],
  ];
  for (const row of guests) {
    run(
      'INSERT INTO guests (full_name, email, phone, nationality, notes) VALUES (?, ?, ?, ?, ?)',
      row,
    );
  }

  const reservations = [
    [1, 2, '2026-09-28', '2026-10-02', 'en_cours', 180000],
    [2, 6, '2026-09-27', '2026-10-01', 'en_cours', 500000],
    [3, 11, '2026-09-29', '2026-10-03', 'confirmee', 288000],
    [4, 5, '2026-09-20', '2026-09-24', 'terminee', 288000],
    [5, 9, '2026-10-04', '2026-10-08', 'confirmee', 840000],
    [1, 4, '2026-09-25', '2026-09-27', 'terminee', 90000],
  ];
  for (const row of reservations) {
    run(
      'INSERT INTO reservations (guest_id, room_id, check_in, check_out, status, total) VALUES (?, ?, ?, ?, ?, ?)',
      row,
    );
  }

  const services = [
    ['Spa & massage', 'Soin 60 minutes, huiles locales.', 25000, 'spa'],
    ['Navette aéroport', 'Aller-retour selon horaires de vol.', 18000, 'map'],
    ['Room service 24h', 'Plateau repas en chambre.', 4000, 'food-menu'],
    ['Blanchisserie', 'Pressing express 4 heures.', 6000, 'droplet'],
    ['Salle de sport', 'Accès illimité pendant le séjour.', 0, 'wind'],
    ['Wi-Fi premium', 'Bande passante dédiée.', 0, 'wifi'],
    ['Coffre réception', 'Dépôt de valeurs.', 0, 'lock-alt'],
    ['Petit-déjeuner buffet', 'Servi de 6h30 à 10h30.', 8500, 'coffee'],
  ];
  for (const row of services) {
    run('INSERT INTO services (name, description, price, icon) VALUES (?, ?, ?, ?)', row);
  }

  const invoices = [
    ['Claire Dubois', 180000, 'en_attente', '2026-09-28', 'Séjour chambre 102'],
    ['Kwame Asante', 500000, 'payee', '2026-09-27', 'Suite 201'],
    ['Thomas Berger', 288000, 'payee', '2026-09-24', 'Chambre 106'],
    ['Aïcha Koné', 840000, 'en_attente', '2026-09-29', 'Suite présidentielle'],
    ['Nadia El Mansouri', 288000, 'en_retard', '2026-09-22', 'Réservation 303'],
  ];
  for (const row of invoices) {
    run(
      'INSERT INTO invoices (guest_name, amount, status, issued_at, label) VALUES (?, ?, ?, ?, ?)',
      row,
    );
  }
}

function seedStaffAccounts() {
  const password = hashPassword('password123');
  const accounts = [
    ['Amina Koffi', 'reception@myhotel.test', 'receptionist'],
    ['Jean-Marc Yao', 'gerant@myhotel.test', 'manager'],
    ['Koffi Mensah', 'entretien@myhotel.test', 'housekeeping'],
    ['Lucie Bamba', 'proprio@myhotel.test', 'owner'],
  ];
  for (const [fullName, email, role] of accounts) {
    const existing = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      run('UPDATE users SET role = ?, full_name = ? WHERE id = ?', [role, fullName, existing.id]);
    } else {
      run('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
        fullName,
        email,
        password,
        role,
      ]);
    }
  }
  run("UPDATE users SET role = 'owner' WHERE email = 'admin@myhotel.test'");
  run("UPDATE users SET role = 'client' WHERE role IS NULL OR role = ''");
}

async function openDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE) && fs.existsSync(LEGACY_DB)) {
    fs.copyFileSync(LEGACY_DB, DB_FILE);
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  if (fs.existsSync(DB_FILE)) {
    db = new SQL.Database(fs.readFileSync(DB_FILE));
  } else {
    db = new SQL.Database();
  }

  ensureSchema();
  ensurePmsSchema({ all, get, run });
  seedIfEmpty();
  seedPms({ all, get, run, lastId });
  seedStaffAccounts();
  persist();
  return {
    all,
    get,
    run,
    lastId,
    persist,
    hashPassword,
    verifyPassword,
    publicUser,
  };
}

module.exports = { openDatabase };
