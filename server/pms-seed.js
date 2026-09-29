function day(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function stamp(offset, hour = 9) {
  return `${day(offset)} ${String(hour).padStart(2, '0')}:15`;
}

function seedPms(db) {
  const version = db.get("SELECT value FROM app_meta WHERE key = 'seed_version'");
  if (version && Number(version.value) >= 2) return;
  if (Number(db.get('SELECT COUNT(*) AS n FROM work_orders').n) > 0) {
    db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', '2')");
    return;
  }

  db.run('UPDATE guests SET vip = 1, loyalty_nights = 42 WHERE id = 1');
  db.run('UPDATE guests SET vip = 1, loyalty_nights = 18 WHERE id = 5');
  db.run('UPDATE guests SET loyalty_nights = 9 WHERE id = 2');

  db.run("UPDATE reservations SET source = 'reservation', confirmed = 1, adults = 2, deposit_amount = 50000 WHERE id = 1");
  db.run("UPDATE reservations SET source = 'walk_in', confirmed = 1, adults = 1, notes = 'Arrivée spontanée 21h' WHERE id = 2");
  db.run("UPDATE reservations SET source = 'reservation', confirmed = 0, adults = 2, notes = 'En attente d’acompte' WHERE id = 3");
  db.run("UPDATE reservations SET confirmed = 1, adults = 2 WHERE id = 4");
  db.run("UPDATE reservations SET confirmed = 1, adults = 2, deposit_amount = 200000, notes = 'VIP — champagne' WHERE id = 5");
  db.run('UPDATE reservations SET confirmed = 1, adults = 1 WHERE id = 6');

  const payroll = [
    [1, 'CDI', 'Mensuel', 180000, 'SYNATHO', 'SAAR', 'CNPS-10021', 'CM21 0001 000000 01'],
    [2, 'CDI', 'Mensuel', 650000, null, 'SAAR', 'CNPS-10002', 'CM21 0001 000000 02'],
    [3, 'CDI', 'Mensuel', 280000, 'SYNATHO', 'SAAR', 'CNPS-10033', 'CM21 0001 000000 03'],
    [4, 'CDD', 'Mensuel', 120000, null, null, 'CNPS-10044', null],
    [5, 'CDI', 'Mensuel', 320000, null, 'SAAR', 'CNPS-10055', 'CM21 0001 000000 05'],
    [6, 'CDI', 'Horaire', 1500, null, null, 'CNPS-10066', null],
    [7, 'CDI', 'Mensuel', 420000, null, 'SAAR', 'CNPS-10077', 'CM21 0001 000000 07'],
    [8, 'CDI', 'Mensuel', 210000, null, 'SAAR', 'CNPS-10088', 'CM21 0001 000000 08'],
    [9, 'CDI', 'Mensuel', 190000, null, 'SAAR', 'CNPS-10099', null],
    [10, 'CDD', 'Mensuel', 90000, null, null, 'CNPS-10100', null],
  ];
  for (const row of payroll) {
    db.run(
      `UPDATE staff SET contract_type=?, salary_type=?, salary_amount=?, union_name=?, mutual_name=?, cnps_number=?, iban=? WHERE id=?`,
      [...row.slice(1), row[0]],
    );
  }
  db.run("UPDATE staff SET departure_type = 'Licenciement', departure_at = ? WHERE id = 10", [day(-40)]);

  const lost = [
    ['Claire Dubois', '102', 'Passeport français', 'consigne', 'Coffre réception', 'en_coffre', day(-1), null, 'Remise prévue au départ'],
    ['Kwame Asante', '201', 'Chargeur MacBook', 'oublie', 'Chambre 201', 'identifie', day(0), null, 'Contacté par WhatsApp'],
    ['Nadia El Mansouri', '303', 'Foulard soie', 'oublie', 'Blanchisserie', 'restitue', day(-3), day(-2), 'Restitué à la réception'],
    ['Thomas Berger', '106', 'Clés de voiture', 'consigne', 'Coffre réception', 'restitue', day(-8), day(-6), null],
  ];
  for (const row of lost) {
    db.run(
      'INSERT INTO lost_items (guest_name, room_number, item, kind, location, status, stored_at, returned_at, notes) VALUES (?,?,?,?,?,?,?,?,?)',
      row,
    );
  }

  const visits = [
    ['Paul Nkomo', 'Claire Dubois', '102', 'Visite familiale', stamp(0, 10), stamp(0, 12)],
    ['Agence Traoré', 'Kwame Asante', '201', 'Rendez-vous d’affaires', stamp(0, 8), null],
    ['Léa Mballa', 'Aïcha Koné', '301', 'Livraison fleurs', stamp(-1, 16), stamp(-1, 16)],
  ];
  for (const row of visits) {
    db.run(
      'INSERT INTO visits (visitor_name, host_name, room_number, purpose, arrived_at, left_at) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const vip = [
    ['Aïcha Koné', '301', 'Champagne & fruits à l’arrivée', stamp(5, 14), 'planifie', 'Suite présidentielle'],
    ['Claire Dubois', '102', 'Oreiller hypoallergénique', stamp(0, 7), 'fait', null],
    ['Kwame Asante', '201', 'Navette aéroport 05h40', stamp(2, 5), 'planifie', 'Vol Accra'],
  ];
  for (const row of vip) {
    db.run(
      'INSERT INTO vip_tasks (guest_name, room_number, service, scheduled_at, status, notes) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  db.run(
    'INSERT INTO room_transfers (reservation_id, guest_name, from_room, to_room, reason, at) VALUES (?,?,?,?,?,?)',
    [1, 'Claire Dubois', '101', '102', 'Demande étage calme', stamp(-1, 11)],
  );

  const charges = [
    [1, 'Claire Dubois', 'hebergement', 'Nuitée chambre 102', 45000, day(0), null],
    [1, 'Claire Dubois', 'pos', 'Petit-déjeuner restaurant', 8500, day(0), 'Restaurant Le Palmier'],
    [1, 'Claire Dubois', 'service', 'Blanchisserie express', 6000, day(-1), null],
    [2, 'Kwame Asante', 'hebergement', 'Nuitée suite 201', 125000, day(0), null],
    [2, 'Kwame Asante', 'pos', 'Dîner + vins', 42000, day(-1), 'Restaurant Le Palmier'],
    [2, 'Kwame Asante', 'pos', 'Bar lounge', 12000, day(-1), 'Bar Sunset'],
    [5, 'Aïcha Koné', 'arrhes', 'Acompte suite présidentielle', 200000, day(-2), null],
  ];
  for (const row of charges) {
    db.run(
      'INSERT INTO folio_charges (reservation_id, guest_name, source, label, amount, at, outlet) VALUES (?,?,?,?,?,?,?)',
      row,
    );
  }

  const inspections = [
    ['202', 'Fatou Diarra', stamp(0, 8), 'anomalie', 'Ampoule salon HS, minibar incomplet', 0],
    ['102', 'Fatou Diarra', stamp(0, 9), 'ok', 'Contrôle départ — OK', 1],
    ['201', 'Koffi Mensah', stamp(-1, 15), 'ok', 'Recouche effectuée', 1],
    ['302', 'Fatou Diarra', stamp(0, 7), 'anomalie', 'Fuite robinet — maintenance', 0],
  ];
  for (const row of inspections) {
    db.run(
      'INSERT INTO inspections (room_number, inspector, at, result, notes, ready_for_control) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const anomalies = [
    ['202', 'Électricité', 'Ampoule salon grillée', 'ouverte', 'Paul Kouassi', stamp(0, 8)],
    ['302', 'Plomberie', 'Fuite mitigeur lavabo', 'en_cours', 'Paul Kouassi', stamp(0, 7)],
    ['Lobby', 'Lieux publics', 'Tache tapis hall', 'ouverte', 'Koffi Mensah', stamp(0, 10)],
  ];
  for (const row of anomalies) {
    db.run(
      'INSERT INTO anomalies (room_number, category, description, status, assigned_to, at) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const hk = [
    ['202', 'Koffi Mensah', 'haute', 'en_cours', 25, stamp(0, 11)],
    ['303', 'Koffi Mensah', 'haute', 'a_faire', 40, stamp(0, 14)],
    ['102', 'Fatou Diarra', 'normale', 'controle', 0, stamp(0, 9)],
    ['203', 'Koffi Mensah', 'normale', 'a_faire', 35, stamp(0, 16)],
  ];
  for (const row of hk) {
    db.run(
      'INSERT INTO hk_tasks (room_number, attendant, priority, status, eta_minutes, due_at) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const eqMoves = [
    ['Aspirateur Dyson', '202', 'in', 1, stamp(0, 8), 'Nettoyage départ'],
    ['Chariot linge', 'Étage 2', 'out', 1, stamp(0, 7), 'Descente blanchisserie'],
    ['Sèche-cheveux', '106', 'out', 1, stamp(-1, 18), 'Remplacement HS'],
    ['Minibar Coca x12', '201', 'in', 12, stamp(0, 9), 'Réassort'],
  ];
  for (const row of eqMoves) {
    db.run(
      'INSERT INTO equipment_moves (item, room_number, direction, qty, at, note) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const subs = [
    ['Pressing Express Douala', 'Linge plat & nappes', '120 kg linge', 'en_cours', 85000, 'en_attente'],
    ['Clim Froid Service', 'Entretien climatiseurs', '12 splits', 'termine', 240000, 'payee'],
  ];
  for (const row of subs) {
    db.run(
      'INSERT INTO subcontractors (name, service, equipment, status, invoice_amount, invoice_status) VALUES (?,?,?,?,?,?)',
      row,
    );
  }

  const orders = [
    ['302', 'Fuite mitigeur lavabo', 'Plomberie', 'urgente', 'en_cours', 'Paul Kouassi', stamp(0, 7), null, null, 0, 'Robinet à remplacer'],
    ['202', 'Ampoule salon', 'Électricité', 'normale', 'ouvert', 'Paul Kouassi', stamp(0, 8), null, null, 0, null],
    [null, 'Filtres clim étage 3', 'Climatisation', 'basse', 'planifie', 'Paul Kouassi', day(3), null, null, 1, 'Maintenance préventive trimestrielle'],
    ['101', 'Serrure carte défectueuse', 'Serrurerie', 'urgente', 'clos', 'Paul Kouassi', stamp(-2, 9), stamp(-2, 14), 'Jean-Marc Yao', 0, 'Cylindre changé'],
  ];
  for (const row of orders) {
    db.run(
      'INSERT INTO work_orders (room_number, title, nature, urgency, status, assigned_to, opened_at, closed_at, validated_by, preventive, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      row,
    );
  }

  db.run("INSERT INTO warehouses (name, kind) VALUES ('Magasin central', 'magasin')");
  db.run("INSERT INTO warehouses (name, kind) VALUES ('Cuisine restaurant', 'pos')");
  db.run("INSERT INTO warehouses (name, kind) VALUES ('Bar Sunset', 'pos')");
  db.run("INSERT INTO warehouses (name, kind) VALUES ('Boutique lobby', 'pos')");

  const products = [
    ['Riz parfumé 25kg', 'Épicerie', 'sac', 8, 4, 18000, 0, 1],
    ['Huile 5L', 'Épicerie', 'bidon', 12, 6, 7500, 0, 1],
    ['Eau minérale 1.5L', 'Boisson', 'pack', 40, 20, 2500, 3500, 1],
    ['Poulet entier', 'Frais', 'kg', 18, 10, 2800, 0, 2],
    ['Filet de capitaine', 'Frais', 'kg', 6, 8, 4500, 0, 2],
    ['Cocktail Coco', 'Bar', 'u', 30, 12, 800, 6000, 3],
    ['Bière 33cl', 'Bar', 'casier', 9, 6, 12000, 0, 3],
    ['Savon d’accueil', 'Amenities', 'carton', 5, 3, 15000, 0, 1],
    ['Carte postale', 'Boutique', 'u', 80, 20, 200, 1500, 4],
    ['Pagne souvenir', 'Boutique', 'u', 14, 5, 4500, 12000, 4],
  ];
  for (const row of products) {
    db.run(
      'INSERT INTO products (name, category, unit, stock, min_stock, cost, price, warehouse_id) VALUES (?,?,?,?,?,?,?,?)',
      row,
    );
  }

  db.run("INSERT INTO suppliers (name, phone, email) VALUES ('SOCA Distrib','+237 233 42 10 10','commande@soca.cm')");
  db.run("INSERT INTO suppliers (name, phone, email) VALUES ('Frais du Littoral','+237 677 20 11 90','livraison@fdl.cm')");
  db.run("INSERT INTO suppliers (name, phone, email) VALUES ('Amenities Afrique','+237 699 10 22 33','hello@amenaf.cm')");

  db.run(
    'INSERT INTO purchase_orders (supplier_id, status, ordered_at, total, delivery_at, invoice_ref, paid) VALUES (?,?,?,?,?,?,?)',
    [1, 'livree', day(-4), 145000, day(-2), 'FAC-SOCA-884', 1],
  );
  db.run(
    'INSERT INTO purchase_orders (supplier_id, status, ordered_at, total, delivery_at, invoice_ref, paid) VALUES (?,?,?,?,?,?,?)',
    [2, 'a_recevoir', day(-1), 72000, null, null, 0],
  );
  db.run(
    'INSERT INTO purchase_orders (supplier_id, status, ordered_at, total, delivery_at, invoice_ref, paid) VALUES (?,?,?,?,?,?,?)',
    [3, 'a_commander', day(0), 45000, null, null, 0],
  );
  db.run("INSERT INTO purchase_items (order_id, product_name, qty, unit_price) VALUES (1,'Eau minérale 1.5L',20,2500)");
  db.run("INSERT INTO purchase_items (order_id, product_name, qty, unit_price) VALUES (1,'Bière 33cl',4,12000)");
  db.run("INSERT INTO purchase_items (order_id, product_name, qty, unit_price) VALUES (2,'Poulet entier',12,2800)");
  db.run("INSERT INTO purchase_items (order_id, product_name, qty, unit_price) VALUES (3,'Savon d’accueil',3,15000)");

  const moves = [
    ['Eau minérale 1.5L', 'Magasin central', 'in', 20, day(-2), 'BL-SOCA', null],
    ['Eau minérale 1.5L', 'Magasin central', 'transfer', 8, day(-1), 'Réassort bar', 'Bar Sunset'],
    ['Filet de capitaine', 'Cuisine restaurant', 'out', 4, day(0), 'Service dîner', null],
    ['Savon d’accueil', 'Magasin central', 'out', 2, day(0), 'Étages', null],
  ];
  for (const row of moves) {
    db.run(
      'INSERT INTO stock_moves (product_name, warehouse, type, qty, at, note, dest) VALUES (?,?,?,?,?,?,?)',
      row,
    );
  }

  db.run(
    'INSERT INTO inventories (warehouse, at, counted_by, variance, status) VALUES (?,?,?,?,?)',
    ['Magasin central', day(-7), 'Lucie Bamba', -2, 'clos'],
  );
  db.run(
    'INSERT INTO inventories (warehouse, at, counted_by, variance, status) VALUES (?,?,?,?,?)',
    ['Cuisine restaurant', day(0), 'Sarah N’Guessan', 0, 'en_cours'],
  );

  const outlets = [
    ['Restaurant Le Palmier', 'restaurant', 2, 64],
    ['Snack Piscine', 'snack', 2, 20],
    ['Bar Sunset', 'bar', 3, 28],
    ['Salon de thé Or', 'salon', 2, 16],
    ['Cabaret Nuit', 'cabaret', 3, 80],
    ['Boutique Lobby', 'boutique', 4, 0],
  ];
  for (const row of outlets) {
    db.run('INSERT INTO outlets (name, type, warehouse_id, seats) VALUES (?,?,?,?)', row);
  }
  db.run("INSERT INTO sellers (name, outlet_id) VALUES ('Ibrahim Traoré', 1)");
  db.run("INSERT INTO sellers (name, outlet_id) VALUES ('Marie Adjoua', 3)");
  db.run("INSERT INTO sellers (name, outlet_id) VALUES ('Amina Koffi', 6)");

  const sales = [
    ['Restaurant Le Palmier', 'Ibrahim Traoré', 'Claire Dubois', '102', 8500, stamp(0, 8)],
    ['Restaurant Le Palmier', 'Ibrahim Traoré', 'Kwame Asante', '201', 42000, stamp(-1, 20)],
    ['Bar Sunset', 'Marie Adjoua', 'Kwame Asante', '201', 12000, stamp(-1, 22)],
    ['Boutique Lobby', 'Amina Koffi', null, null, 13500, stamp(0, 11)],
    ['Snack Piscine', 'Ibrahim Traoré', 'Nadia El Mansouri', '303', 6500, stamp(0, 13)],
  ];
  for (const row of sales) {
    db.run(
      'INSERT INTO pos_sales (outlet, seller, guest_name, room_number, total, at) VALUES (?,?,?,?,?,?)',
      row,
    );
  }
  db.run("INSERT INTO pos_sale_items (sale_id, product_name, qty, price) VALUES (1,'Petit-déjeuner buffet',1,8500)");
  db.run("INSERT INTO pos_sale_items (sale_id, product_name, qty, price) VALUES (2,'Filet de capitaine',1,16000)");
  db.run("INSERT INTO pos_sale_items (sale_id, product_name, qty, price) VALUES (2,'Cocktail Coco Sunset',2,6000)");
  db.run("INSERT INTO pos_sale_items (sale_id, product_name, qty, price) VALUES (4,'Pagne souvenir',1,12000)");

  const venues = [
    ['Salle Baobab', 'Réunion', 80, 150000, 'disponible'],
    ['Salle Palais', 'Réception', 220, 450000, 'occupee'],
    ['Terrasse Piscine', 'Espace détente', 140, 180000, 'disponible'],
    ['Salon Billard', 'Espace détente', 35, 40000, 'disponible'],
  ];
  for (const row of venues) {
    db.run('INSERT INTO venues (name, type, area_m2, rate, status) VALUES (?,?,?,?,?)', row);
  }
  db.run(
    'INSERT INTO venue_bookings (venue_id, client_name, start_at, end_at, status, amount, paid, currency) VALUES (?,?,?,?,?,?,?,?)',
    [2, 'Société Atlantic SA', day(1), day(1), 'facture', 450000, 200000, 'XAF'],
  );
  db.run(
    'INSERT INTO venue_bookings (venue_id, client_name, start_at, end_at, status, amount, paid, currency) VALUES (?,?,?,?,?,?,?,?)',
    [1, 'Cabinet KZ', day(4), day(4), 'proforma', 150000, 0, 'XAF'],
  );
  db.run(
    'INSERT INTO venue_bookings (venue_id, client_name, start_at, end_at, status, amount, paid, currency) VALUES (?,?,?,?,?,?,?,?)',
    [3, 'Famille Ngo', day(6), day(6), 'paye', 180000, 180000, 'EUR'],
  );
  db.run(
    "INSERT INTO venue_payments (booking_id, amount, currency, at, method) VALUES (1, 200000, 'XAF', ?, 'Virement')",
    [day(-1)],
  );
  db.run(
    "INSERT INTO venue_payments (booking_id, amount, currency, at, method) VALUES (3, 180000, 'EUR', ?, 'Espèces')",
    [day(-3)],
  );

  db.run("INSERT INTO cash_registers (name) VALUES ('Caisse réception')");
  db.run("INSERT INTO cash_registers (name) VALUES ('Caisse restaurant')");
  db.run("INSERT INTO cash_registers (name) VALUES ('Caisse principale')");
  db.run(
    'INSERT INTO cash_sessions (register, cashier, opened_at, closed_at, opening_float, closing_amount, status) VALUES (?,?,?,?,?,?,?)',
    ['Caisse réception', 'Amina Koffi', stamp(0, 6), null, 100000, null, 'ouverte'],
  );
  db.run(
    'INSERT INTO cash_sessions (register, cashier, opened_at, closed_at, opening_float, closing_amount, status) VALUES (?,?,?,?,?,?,?)',
    ['Caisse restaurant', 'Ibrahim Traoré', stamp(-1, 7), stamp(-1, 23), 50000, 186000, 'cloturee'],
  );
  db.run("INSERT INTO cash_lines (session_id, type, label, amount, at) VALUES (1,'supply','Fond de caisse',100000, ?)", [
    stamp(0, 6),
  ]);
  db.run("INSERT INTO cash_lines (session_id, type, label, amount, at) VALUES (1,'receipt','Arrhes Aïcha Koné',200000, ?)", [
    stamp(0, 9),
  ]);
  db.run("INSERT INTO cash_lines (session_id, type, label, amount, at) VALUES (1,'expense','Taxi navette aéroport',8000, ?)", [
    stamp(0, 10),
  ]);
  db.run("INSERT INTO cash_lines (session_id, type, label, amount, at) VALUES (2,'receipt','Recettes restaurant J-1',142000, ?)", [
    stamp(-1, 23),
  ]);

  db.run(
    'INSERT INTO deposits (guest_name, reservation_id, amount, status, at) VALUES (?,?,?,?,?)',
    ['Aïcha Koné', 5, 200000, 'affecte', day(-2)],
  );
  db.run(
    'INSERT INTO deposits (guest_name, reservation_id, amount, status, at) VALUES (?,?,?,?,?)',
    ['Claire Dubois', 1, 50000, 'held', day(-3)],
  );
  db.run(
    'INSERT INTO deposits (guest_name, reservation_id, amount, status, at) VALUES (?,?,?,?,?)',
    ['Thomas Berger', 4, 40000, 'rembourse', day(-9)],
  );

  db.run(
    "INSERT INTO cost_allocations (label, amount, period, method, target) VALUES ('Salaires septembre', 2400000, '2026-09', 'globale', 'Toutes chambres + salles')",
  );
  db.run(
    "INSERT INTO cost_allocations (label, amount, period, method, target) VALUES ('Électricité', 420000, '2026-09', 'plusieurs_mois', 'Chambres + cuisine')",
  );
  db.run(
    "INSERT INTO cost_allocations (label, amount, period, method, target) VALUES ('Entretien piscine', 85000, '2026-09', 'selective', 'Terrasse Piscine')",
  );

  for (let i = 0; i < 7; i += 1) {
    db.run('INSERT INTO timesheets (staff_id, day, present, overtime_hours) VALUES (?,?,?,?)', [
      1,
      day(-i),
      i === 6 ? 0 : 1,
      i === 1 ? 2 : 0,
    ]);
    db.run('INSERT INTO timesheets (staff_id, day, present, overtime_hours) VALUES (?,?,?,?)', [
      4,
      day(-i),
      1,
      0,
    ]);
  }
  db.run("INSERT INTO sanctions (staff_id, type, at, note) VALUES (6, 'Avertissement', ?, 'Retard répété')", [day(-12)]);
  db.run("INSERT INTO advances (staff_id, kind, amount, at) VALUES (4, 'acompte', 20000, ?)", [day(-5)]);
  db.run("INSERT INTO advances (staff_id, kind, amount, at) VALUES (8, 'avance', 50000, ?)", [day(-10)]);

  function bulletin(staffId, gross, overtime, indemnities, adv) {
    const base = Math.min(gross + overtime + indemnities, 750000);
    const cnpsE = Math.round(base * 0.042);
    const cnpsR = Math.round(base * 0.112);
    const irpp = Math.round(Math.max(0, gross - 50000) * 0.1);
    const cac = Math.round(irpp * 0.1);
    const cfc = Math.round(gross * 0.01);
    const tdl = Math.round(gross * 0.01);
    const rav = 2000;
    const pv = 0;
    const net = gross + overtime + indemnities - cnpsE - irpp - cac - cfc - tdl - rav - pv - adv;
    db.run(
      `INSERT INTO payslips (staff_id, period, gross, overtime, indemnities, irpp, cac, cfc, rav, tdl, pv, cnps_employee, cnps_employer, advances, net, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [staffId, '2026-09', gross, overtime, indemnities, irpp, cac, cfc, rav, tdl, pv, cnpsE, cnpsR, adv, net, 'valide'],
    );
  }
  bulletin(1, 180000, 8000, 15000, 0);
  bulletin(2, 650000, 0, 80000, 0);
  bulletin(3, 280000, 0, 20000, 0);
  bulletin(4, 120000, 0, 0, 20000);
  bulletin(7, 420000, 0, 25000, 0);
  bulletin(8, 210000, 5000, 10000, 50000);

  const assets = [
    ['Immobilier — bâtiment principal', 'corporelle', 'Constructions', 850000000, 'lineaire', 25, 'Direction', 'actif', '2015-04-01'],
    ['Minibus Toyota HiAce', 'corporelle', 'Véhicules', 18500000, 'lineaire', 5, 'Réception', 'actif', '2022-06-12'],
    ['Groupe électrogène 110 kVA', 'corporelle', 'Installations', 9200000, 'degressif', 8, 'Maintenance', 'actif', '2020-01-20'],
    ['Logiciel PMS MyHotel', 'incorporelle', 'Logiciels', 3500000, 'lineaire', 3, 'Informatique', 'actif', '2025-09-01'],
    ['Dépôt caution ENEO', 'financiere', 'Dépôts', 2500000, 'lineaire', 10, 'Comptabilité', 'actif', '2018-03-01'],
    ['TV 55" lot étage 2', 'corporelle', 'Mobilier', 1800000, 'lineaire', 4, 'Étages', 'cede', '2021-11-08'],
  ];
  for (const row of assets) {
    db.run(
      'INSERT INTO assets (name, kind, category, value, method, life_years, assigned_to, status, acquired_at) VALUES (?,?,?,?,?,?,?,?,?)',
      row,
    );
  }
  db.run(
    "INSERT INTO asset_events (asset_id, type, at, note, amount) VALUES (2, 'maintenance', ?, 'Vidange + pneus', 180000)",
    [day(-20)],
  );
  db.run(
    "INSERT INTO asset_events (asset_id, type, at, note, amount) VALUES (6, 'cession', ?, 'Remplacement lot TV', 200000)",
    [day(-60)],
  );
  db.run(
    "INSERT INTO asset_events (asset_id, type, at, note, amount) VALUES (3, 'affectation', ?, 'Affecté local technique', 0)",
    [day(-400)],
  );

  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', '2')");
}

module.exports = { seedPms, day };
