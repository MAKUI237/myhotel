function addColumn(db, table, column, def) {
  const cols = db.all(`PRAGMA table_info(${table})`).map((c) => c.name);
  if (!cols.includes(column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
}

function ensurePmsSchema(db) {
  db.run(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`);

  addColumn(db, 'users', 'last_login', 'TEXT');
  addColumn(db, 'users', 'photo', 'TEXT');
  addColumn(db, 'users', 'role', "TEXT NOT NULL DEFAULT 'client'");

  addColumn(db, 'guests', 'vip', 'INTEGER NOT NULL DEFAULT 0');
  addColumn(db, 'guests', 'document_id', 'TEXT');
  addColumn(db, 'guests', 'loyalty_nights', 'INTEGER NOT NULL DEFAULT 0');

  addColumn(db, 'rooms', 'video', 'TEXT');
  addColumn(db, 'reservations', 'source', "TEXT NOT NULL DEFAULT 'reservation'");
  addColumn(db, 'reservations', 'confirmed', 'INTEGER NOT NULL DEFAULT 1');
  addColumn(db, 'reservations', 'notes', 'TEXT');
  addColumn(db, 'reservations', 'deposit_amount', 'REAL NOT NULL DEFAULT 0');
  addColumn(db, 'reservations', 'adults', 'INTEGER NOT NULL DEFAULT 1');
  addColumn(db, 'reservations', 'children', 'INTEGER NOT NULL DEFAULT 0');

  addColumn(db, 'staff', 'contract_type', "TEXT DEFAULT 'CDI'");
  addColumn(db, 'staff', 'salary_type', "TEXT DEFAULT 'Mensuel'");
  addColumn(db, 'staff', 'salary_amount', 'REAL NOT NULL DEFAULT 0');
  addColumn(db, 'staff', 'union_name', 'TEXT');
  addColumn(db, 'staff', 'mutual_name', 'TEXT');
  addColumn(db, 'staff', 'cnps_number', 'TEXT');
  addColumn(db, 'staff', 'iban', 'TEXT');
  addColumn(db, 'staff', 'departure_type', 'TEXT');
  addColumn(db, 'staff', 'departure_at', 'TEXT');
  addColumn(db, 'staff', 'id_number', 'TEXT');

  const tables = [
    `CREATE TABLE IF NOT EXISTS lost_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      room_number TEXT,
      item TEXT NOT NULL,
      kind TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL,
      stored_at TEXT NOT NULL,
      returned_at TEXT,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_name TEXT NOT NULL,
      host_name TEXT,
      room_number TEXT,
      purpose TEXT,
      arrived_at TEXT NOT NULL,
      left_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vip_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      room_number TEXT,
      service TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS room_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER,
      guest_name TEXT NOT NULL,
      from_room TEXT NOT NULL,
      to_room TEXT NOT NULL,
      reason TEXT,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS folio_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER,
      guest_name TEXT NOT NULL,
      source TEXT NOT NULL,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      at TEXT NOT NULL,
      outlet TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL,
      inspector TEXT NOT NULL,
      at TEXT NOT NULL,
      result TEXT NOT NULL,
      notes TEXT,
      ready_for_control INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS hk_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL,
      attendant TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      eta_minutes INTEGER NOT NULL,
      due_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS equipment_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item TEXT NOT NULL,
      room_number TEXT,
      direction TEXT NOT NULL,
      qty INTEGER NOT NULL,
      at TEXT NOT NULL,
      note TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS subcontractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      service TEXT NOT NULL,
      equipment TEXT,
      status TEXT NOT NULL,
      invoice_amount REAL NOT NULL DEFAULT 0,
      invoice_status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT,
      title TEXT NOT NULL,
      nature TEXT NOT NULL,
      urgency TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      validated_by TEXT,
      preventive INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      stock REAL NOT NULL,
      min_stock REAL NOT NULL,
      cost REAL NOT NULL,
      price REAL NOT NULL,
      warehouse_id INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      ordered_at TEXT NOT NULL,
      total REAL NOT NULL,
      delivery_at TEXT,
      invoice_ref TEXT,
      paid INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      warehouse TEXT NOT NULL,
      type TEXT NOT NULL,
      qty REAL NOT NULL,
      at TEXT NOT NULL,
      note TEXT,
      dest TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS inventories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse TEXT NOT NULL,
      at TEXT NOT NULL,
      counted_by TEXT,
      variance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS outlets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      warehouse_id INTEGER NOT NULL,
      seats INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      outlet_id INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pos_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outlet TEXT NOT NULL,
      seller TEXT NOT NULL,
      guest_name TEXT,
      room_number TEXT,
      total REAL NOT NULL,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pos_sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      price REAL NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      area_m2 REAL NOT NULL,
      rate REAL NOT NULL,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS venue_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'XAF'
    )`,
    `CREATE TABLE IF NOT EXISTS venue_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      at TEXT NOT NULL,
      method TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cash_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register TEXT NOT NULL,
      cashier TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_float REAL NOT NULL,
      closing_amount REAL,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cash_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      reservation_id INTEGER,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cost_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      method TEXT NOT NULL,
      target TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      present INTEGER NOT NULL,
      overtime_hours REAL NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sanctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      at TEXT NOT NULL,
      note TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      amount REAL NOT NULL,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS payslips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      gross REAL NOT NULL,
      overtime REAL NOT NULL,
      indemnities REAL NOT NULL,
      irpp REAL NOT NULL,
      cac REAL NOT NULL,
      cfc REAL NOT NULL,
      rav REAL NOT NULL,
      tdl REAL NOT NULL,
      pv REAL NOT NULL,
      cnps_employee REAL NOT NULL,
      cnps_employer REAL NOT NULL,
      advances REAL NOT NULL,
      net REAL NOT NULL,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      category TEXT NOT NULL,
      value REAL NOT NULL,
      method TEXT NOT NULL,
      life_years INTEGER NOT NULL,
      assigned_to TEXT,
      status TEXT NOT NULL,
      acquired_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS asset_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      at TEXT NOT NULL,
      note TEXT,
      amount REAL
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS room_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS client_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      code TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      role TEXT,
      message TEXT NOT NULL,
      reply TEXT,
      status TEXT NOT NULL DEFAULT 'ouverte',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS cash_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      actor TEXT NOT NULL,
      at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS staff_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_name TEXT NOT NULL,
      day TEXT NOT NULL,
      start_hour TEXT NOT NULL,
      end_hour TEXT NOT NULL,
      task TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS indemnity_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      amount REAL NOT NULL,
      at TEXT NOT NULL,
      note TEXT
    )`,
  ];

  for (const sql of tables) db.run(sql);
  seedNotifications(db);
  seedWorkspace(db);
}

function seedNotifications(db) {
  if (Number(db.get('SELECT COUNT(*) AS n FROM notifications').n) > 0) return;

  const users = db.all('SELECT full_name, email, created_at FROM users ORDER BY id DESC LIMIT 4');
  for (const user of users) {
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'COMPTE',
        'Nouvel inscrit',
        `${user.full_name} (${user.email}) vient de créer un compte.`,
        null,
        0,
        user.created_at,
      ],
    );
  }

  const extras = [
    ['RÉSERVATION', 'Nouvelle réservation', 'Chambre 102 — Claire Dubois, arrivée demain.', 0, "datetime('now', '-2 hours')"],
    ['ÉTAGES', 'Chambre prête', 'Chambre 201 nettoyée et inspectée.', 1, "datetime('now', '-1 day')"],
    ['MAINTENANCE', 'Ticket ouvert', 'Climatisation 303 — intervention demandée.', 0, "datetime('now', '-2 days')"],
    ['RÉSERVATION', 'Check-in du jour', 'Kwame Asante — chambre 201.', 1, "datetime('now', '-4 days')"],
  ];
  for (const [category, title, body, isRead, at] of extras) {
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES (?, ?, ?, NULL, ?, ${at})`,
      [category, title, body, isRead],
    );
  }
}

function seedWorkspace(db) {
  if (Number(db.get('SELECT COUNT(*) AS n FROM room_photos').n) === 0) {
    const extras = [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80',
    ];
    for (const room of db.all('SELECT id, photo FROM rooms')) {
      db.run('INSERT INTO room_photos (room_id, url, sort) VALUES (?,?,?)', [room.id, room.photo, 0]);
      extras.forEach((url, i) => {
        db.run('INSERT INTO room_photos (room_id, url, sort) VALUES (?,?,?)', [room.id, url, i + 1]);
      });
    }
  }
  if (Number(db.get('SELECT COUNT(*) AS n FROM suggestions').n) === 0) {
    db.run(
      `INSERT INTO suggestions (author, role, message, status, created_at)
       VALUES ('Amina Koffi', 'receptionist', 'Proposer un late check-out payant le dimanche.', 'ouverte', datetime('now', '-3 hours'))`,
    );
    db.run(
      `INSERT INTO suggestions (author, role, message, status, created_at)
       VALUES ('Koffi Mensah', 'housekeeping', 'Manque de kits d’accueil à l’étage 3.', 'ouverte', datetime('now', '-1 day'))`,
    );
  }
  if (Number(db.get('SELECT COUNT(*) AS n FROM cash_moves').n) === 0) {
    db.run(
      `INSERT INTO cash_moves (kind, label, amount, actor, at)
       VALUES ('entree', 'Encaissement réservations', 180000, 'Jean-Marc Yao', datetime('now', '-2 hours'))`,
    );
    db.run(
      `INSERT INTO cash_moves (kind, label, amount, actor, at)
       VALUES ('sortie', 'Achat fournitures étages', 25000, 'Jean-Marc Yao', datetime('now', '-5 hours'))`,
    );
  }
  if (Number(db.get('SELECT COUNT(*) AS n FROM staff_shifts').n) === 0) {
    const today = new Date().toISOString().slice(0, 10);
    db.run('INSERT INTO staff_shifts (staff_name, day, start_hour, end_hour, task) VALUES (?,?,?,?,?)', [
      'Amina Koffi',
      today,
      '07:00',
      '15:00',
      'Réception matin',
    ]);
    db.run('INSERT INTO staff_shifts (staff_name, day, start_hour, end_hour, task) VALUES (?,?,?,?,?)', [
      'Koffi Mensah',
      today,
      '08:00',
      '16:00',
      'Étages 2 et 3',
    ]);
  }
  if (Number(db.get('SELECT COUNT(*) AS n FROM client_badges').n) === 0) {
    db.run(
      `INSERT INTO client_badges (guest_name, room_number, valid_from, valid_to, code, created_by)
       VALUES ('Claire Dubois', '102', date('now'), date('now','+3 day'), 'MH-102-CL', 'Amina Koffi')`,
    );
  }
  const video =
    'https://videos.pexels.com/video-files/3770033/3770033-hd_1920_1080_25fps.mp4';
  db.run('UPDATE rooms SET video = ? WHERE video IS NULL OR video = \'\'', [video]);
  for (const row of db.all('SELECT id FROM staff WHERE id_number IS NULL OR id_number = \'\'')) {
    db.run('UPDATE staff SET id_number = ? WHERE id = ?', [`CNI-00${1000 + row.id}`, row.id]);
  }
  if (Number(db.get('SELECT COUNT(*) AS n FROM indemnity_lines').n) === 0) {
    const people = db.all('SELECT id FROM staff ORDER BY id LIMIT 3');
    const kinds = [
      ['licenciement', 180000, 'Indemnité de licenciement'],
      ['conges', 45000, 'Indemnité de congés'],
      ['preavis', 90000, 'Indemnité de préavis'],
    ];
    people.forEach((person, i) => {
      const row = kinds[i];
      if (!row) return;
      db.run('INSERT INTO indemnity_lines (staff_id, kind, amount, at, note) VALUES (?,?,?,?,?)', [
        person.id,
        row[0],
        row[1],
        new Date().toISOString().slice(0, 10),
        row[2],
      ]);
    });
  }
  if (!db.get("SELECT id FROM notifications WHERE category = 'URGENCE' LIMIT 1")) {
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES ('ÉTAGES', 'Chambre libre à nettoyer', 'Chambre 106 libérée — passage entretien.', '/housekeeping', 0, datetime('now', '-40 minutes'))`,
    );
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES ('URGENCE', 'Nettoyage urgent', 'Chambre 303 indisponible — intervention immédiate.', '/housekeeping', 0, datetime('now', '-12 minutes'))`,
    );
  }
}

module.exports = { ensurePmsSchema };
