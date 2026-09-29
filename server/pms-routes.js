const { day } = require('./pms-seed');

function num(v) {
  return Number(v || 0);
}

function reservationRows(db) {
  return db.all(
    `SELECT r.*, g.full_name AS guest_name, g.phone AS guest_phone, g.vip AS guest_vip,
            rm.number AS room_number, rm.type AS room_type, rm.photo AS room_photo, rm.status AS room_status
     FROM reservations r
     JOIN guests g ON g.id = r.guest_id
     JOIN rooms rm ON rm.id = r.room_id
     ORDER BY r.check_in DESC`,
  );
}

function planning(db) {
  const rooms = db.all('SELECT id, number, type, floor, status FROM rooms ORDER BY number');
  const days = Array.from({ length: 10 }, (_, i) => day(i - 1));
  const res = reservationRows(db);
  const cells = rooms.map((room) => ({
    ...room,
    days: days.map((d) => {
      const hit = res.find(
        (r) => Number(r.room_id) === Number(room.id) && r.check_in <= d && r.check_out > d && r.status !== 'annulee',
      );
      if (!hit) return { date: d, busy: false };
      return {
        date: d,
        busy: true,
        guest: hit.guest_name,
        status: hit.status,
        confirmed: Number(hit.confirmed) === 1,
        source: hit.source,
        reservation_id: hit.id,
      };
    }),
  }));
  return { days, rooms: cells };
}

function computeKpis(db) {
  const roomCount = num(db.get('SELECT COUNT(*) AS n FROM rooms').n) || 12;
  const live = reservationRows(db).filter((r) => r.status === 'en_cours' || r.status === 'confirmee');
  const occupied = reservationRows(db).filter((r) => r.status === 'en_cours').length;
  const occupancy = roomCount ? occupied / roomCount : 0;
  const roomRevenue = num(db.get("SELECT SUM(amount) AS n FROM folio_charges WHERE source = 'hebergement'").n);
  const posRevenue = num(db.get("SELECT SUM(total) AS n FROM pos_sales").n);
  const venueRevenue = num(db.get('SELECT SUM(paid) AS n FROM venue_bookings').n);
  const allRevenue = roomRevenue + posRevenue + venueRevenue + num(db.get("SELECT SUM(amount) AS n FROM folio_charges WHERE source != 'hebergement'").n);
  const sold = Math.max(occupied, 1);
  const adr = roomRevenue / sold;
  const revpar = occupancy * adr;
  const trevpar = allRevenue / roomCount;
  const seats = num(db.get('SELECT SUM(seats) AS n FROM outlets').n) || 64;
  const revpash = posRevenue / Math.max(seats * 8, 1);
  const guestsIn = Math.max(reservationRows(db).filter((r) => r.status === 'en_cours').length, 1);
  const dined = db.all("SELECT DISTINCT guest_name FROM pos_sales WHERE guest_name IS NOT NULL AND outlet LIKE 'Restaurant%'").length;
  const capture = dined / guestsIn;
  const costs = num(db.get('SELECT SUM(amount) AS n FROM cost_allocations').n);
  const goppar = (allRevenue - costs) / roomCount;
  const revpac = allRevenue / Math.max(db.all('SELECT id FROM guests').length, 1);
  return {
    occupancy,
    adr,
    revpar,
    trevpar,
    revpash,
    revpac,
    goppar,
    capture,
    roomRevenue,
    posRevenue,
    venueRevenue,
    allRevenue,
    costs,
    roomCount,
    occupied,
  };
}

async function handlePms(req, res, ctx) {
  const { db, pathName, method, readBody, ok, fail, requireUser } = ctx;
  if (!pathName.startsWith('/pms')) return false;
  const actor = requireUser(db, req, res);
  if (!actor) return true;

  if (method === 'GET' && pathName === '/pms/front-office') {
    ok(res, {
      reservations: reservationRows(db),
      planning: planning(db),
      lost_items: db.all('SELECT * FROM lost_items ORDER BY stored_at DESC'),
      visits: db.all('SELECT * FROM visits ORDER BY arrived_at DESC'),
      vip_tasks: db.all('SELECT * FROM vip_tasks ORDER BY scheduled_at'),
      transfers: db.all('SELECT * FROM room_transfers ORDER BY at DESC'),
      charges: db.all('SELECT * FROM folio_charges ORDER BY at DESC'),
      rooms: db.all('SELECT id, number, type, floor, status, price_night, photo, video FROM rooms ORDER BY number'),
      guests: db.all('SELECT * FROM guests ORDER BY full_name'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/housekeeping') {
    const mapStatus = (status) => {
      if (status === 'a_faire' || status === 'ouverte') return 'non_prise';
      if (status === 'controle' || status === 'termine') return 'pret';
      if (status === 'nettoyage') return 'en_cours';
      return status;
    };
    ok(res, {
      tasks: db.all("SELECT * FROM hk_tasks ORDER BY CASE priority WHEN 'urgente' THEN 0 WHEN 'haute' THEN 1 ELSE 2 END, room_number").map((t) => ({
        ...t,
        status: mapStatus(t.status),
      })),
      inspections: db.all('SELECT * FROM inspections ORDER BY at DESC'),
      anomalies: db.all('SELECT * FROM anomalies ORDER BY at DESC'),
      moves: db.all('SELECT * FROM equipment_moves ORDER BY at DESC'),
      subcontractors: db.all('SELECT * FROM subcontractors ORDER BY name'),
      rooms: db.all('SELECT number, type, floor, status FROM rooms ORDER BY floor, number'),
      team: db.all("SELECT full_name, role, status FROM staff WHERE department IN ('Étages','Maintenance')"),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/maintenance') {
    ok(res, {
      orders: db.all('SELECT * FROM work_orders ORDER BY opened_at DESC'),
      history: db.all("SELECT nature, COUNT(*) AS n FROM work_orders GROUP BY nature"),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/purchasing') {
    const products = db.all(
      `SELECT p.*, w.name AS warehouse FROM products p JOIN warehouses w ON w.id = p.warehouse_id ORDER BY p.name`,
    );
    ok(res, {
      products,
      to_order: products.filter((p) => Number(p.stock) <= Number(p.min_stock)),
      suppliers: db.all('SELECT * FROM suppliers'),
      orders: db.all(
        `SELECT o.*, s.name AS supplier FROM purchase_orders o JOIN suppliers s ON s.id = o.supplier_id ORDER BY o.ordered_at DESC`,
      ),
      items: db.all('SELECT * FROM purchase_items'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/pos') {
    ok(res, {
      outlets: db.all(
        `SELECT o.*, w.name AS warehouse FROM outlets o JOIN warehouses w ON w.id = o.warehouse_id`,
      ),
      sellers: db.all(
        `SELECT s.*, o.name AS outlet FROM sellers s JOIN outlets o ON o.id = s.outlet_id`,
      ),
      sales: db.all(
        `SELECT s.*, (SELECT product_name FROM pos_sale_items i WHERE i.sale_id = s.id LIMIT 1) AS item
         FROM pos_sales s ORDER BY at DESC`,
      ),
      items: db.all('SELECT * FROM pos_sale_items'),
      menu: db.all('SELECT * FROM menu_items ORDER BY category, name'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/stock') {
    ok(res, {
      warehouses: db.all('SELECT * FROM warehouses'),
      products: db.all(
        `SELECT p.*, w.name AS warehouse FROM products p JOIN warehouses w ON w.id = p.warehouse_id`,
      ),
      moves: db.all('SELECT * FROM stock_moves ORDER BY at DESC'),
      inventories: db.all('SELECT * FROM inventories ORDER BY at DESC'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/venues') {
    ok(res, {
      venues: db.all('SELECT * FROM venues'),
      bookings: db.all(
        `SELECT b.*, v.name AS venue_name, v.area_m2 FROM venue_bookings b JOIN venues v ON v.id = b.venue_id ORDER BY b.start_at`,
      ),
      payments: db.all('SELECT * FROM venue_payments ORDER BY at DESC'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/finance') {
    ok(res, {
      registers: db.all('SELECT * FROM cash_registers'),
      sessions: db.all('SELECT * FROM cash_sessions ORDER BY opened_at DESC'),
      lines: db.all('SELECT * FROM cash_lines ORDER BY at DESC'),
      deposits: db.all('SELECT * FROM deposits ORDER BY at DESC'),
      allocations: db.all('SELECT * FROM cost_allocations ORDER BY period DESC'),
      invoices: db.all('SELECT * FROM invoices ORDER BY issued_at DESC'),
      charges: db.all('SELECT * FROM folio_charges ORDER BY at DESC'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/kpis') {
    ok(res, computeKpis(db));
    return true;
  }

  if (method === 'GET' && pathName === '/pms/reports') {
    const salesByOutlet = db.all(
      'SELECT outlet, COUNT(*) AS n, SUM(total) AS amount FROM pos_sales GROUP BY outlet',
    );
    const loyal = db.all('SELECT full_name, loyalty_nights, nationality, vip FROM guests ORDER BY loyalty_nights DESC');
    const topProducts = db.all(
      'SELECT product_name, SUM(qty) AS qty, SUM(qty*price) AS amount FROM pos_sale_items GROUP BY product_name ORDER BY amount DESC',
    );
    ok(res, {
      kpis: computeKpis(db),
      salesByOutlet,
      loyal,
      topProducts,
      reservations: reservationRows(db),
      venue_bookings: db.all('SELECT * FROM venue_bookings'),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/payroll') {
    const staff = db.all('SELECT * FROM staff ORDER BY department, full_name');
    const payslips = db.all(
      `SELECT p.*, st.full_name, st.role, st.department, st.iban, st.union_name, st.mutual_name, st.id_number
       FROM payslips p JOIN staff st ON st.id = p.staff_id ORDER BY p.net DESC`,
    );
    const byDept = {};
    for (const row of payslips) {
      const key = row.department || 'Siège';
      if (!byDept[key]) byDept[key] = { department: key, n: 0, gross: 0, net: 0 };
      byDept[key].n += 1;
      byDept[key].gross += Number(row.gross);
      byDept[key].net += Number(row.net);
    }
    ok(res, {
      staff,
      timesheets: db.all('SELECT * FROM timesheets ORDER BY day DESC'),
      sanctions: db.all('SELECT s.*, st.full_name FROM sanctions s JOIN staff st ON st.id = s.staff_id'),
      advances: db.all('SELECT a.*, st.full_name FROM advances a JOIN staff st ON st.id = a.staff_id'),
      payslips,
      indemnities: db.all(
        `SELECT i.*, st.full_name FROM indemnity_lines i JOIN staff st ON st.id = i.staff_id ORDER BY i.at DESC`,
      ),
      by_department: Object.values(byDept),
      virements: staff.filter((s) => s.iban),
      mass: payslips.reduce((sum, row) => sum + Number(row.net), 0),
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/assets') {
    ok(res, {
      assets: db.all('SELECT * FROM assets ORDER BY value DESC'),
      events: db.all(
        `SELECT e.*, a.name AS asset_name FROM asset_events e JOIN assets a ON a.id = e.asset_id ORDER BY e.at DESC`,
      ),
    });
    return true;
  }

  if (method === 'POST' && pathName === '/pms/reservations') {
    const body = await readBody(req);
    const guestName = String(body.guest_name || '').trim();
    const roomNumber = String(body.room_number || '').trim();
    const checkIn = String(body.check_in || day(0));
    const checkOut = String(body.check_out || day(1));
    const source = body.source === 'walk_in' ? 'walk_in' : 'reservation';
    if (!guestName || !roomNumber) {
      fail(res, 'Indiquez le client et la chambre.');
      return true;
    }
    let guest = db.get('SELECT * FROM guests WHERE full_name = ? LIMIT 1', [guestName]);
    if (!guest) {
      db.run(
        'INSERT INTO guests (full_name, email, phone, nationality, notes, vip, loyalty_nights) VALUES (?,?,?,?,?,?,?)',
        [guestName, null, body.phone || null, body.nationality || 'Cameroun', null, 0, 0],
      );
      guest = db.get('SELECT * FROM guests WHERE id = ?', [db.lastId()]);
    }
    const room = db.get('SELECT * FROM rooms WHERE number = ?', [roomNumber]);
    if (!room) {
      fail(res, 'Chambre introuvable.');
      return true;
    }
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
    db.run(
      `INSERT INTO reservations (guest_id, room_id, check_in, check_out, status, total, source, confirmed, notes, deposit_amount, adults, children)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        guest.id,
        room.id,
        checkIn,
        checkOut,
        source === 'walk_in' ? 'en_cours' : 'confirmee',
        nights * Number(room.price_night),
        source,
        1,
        body.notes || null,
        Number(body.deposit_amount || 0),
        Number(body.adults || 1),
        Number(body.children || 0),
      ],
    );
    db.run("UPDATE rooms SET status = ? WHERE id = ?", [source === 'walk_in' ? 'occupee' : 'reservee', room.id]);
    ok(res, { id: db.lastId() }, source === 'walk_in' ? 'Walk-in enregistré.' : 'Réservation créée.', 201);
    return true;
  }

  if (method === 'POST' && pathName.match(/^\/pms\/reservations\/(\d+)\/confirm$/)) {
    const id = Number(pathName.split('/')[3]);
    db.run('UPDATE reservations SET confirmed = 1, status = ? WHERE id = ?', ['confirmee', id]);
    ok(res, { id }, 'Réservation confirmée.');
    return true;
  }

  if (method === 'POST' && pathName.match(/^\/pms\/reservations\/(\d+)\/cancel$/)) {
    const id = Number(pathName.split('/')[3]);
    const resv = db.get(
      `SELECT r.*, rm.number AS room_number FROM reservations r JOIN rooms rm ON rm.id = r.room_id WHERE r.id = ?`,
      [id],
    );
    db.run("UPDATE reservations SET status = 'annulee', confirmed = 0 WHERE id = ?", [id]);
    if (resv) db.run("UPDATE rooms SET status = 'disponible' WHERE id = ?", [resv.room_id]);
    ok(res, { id }, 'Réservation annulée.');
    return true;
  }

  if (method === 'POST' && pathName.match(/^\/pms\/reservations\/(\d+)\/transfer$/)) {
    const id = Number(pathName.split('/')[3]);
    const body = await readBody(req);
    const toNumber = String(body.to_room || '').trim();
    const resv = db.get(
      `SELECT r.*, g.full_name AS guest_name, rm.number AS from_room FROM reservations r
       JOIN guests g ON g.id = r.guest_id JOIN rooms rm ON rm.id = r.room_id WHERE r.id = ?`,
      [id],
    );
    const dest = db.get('SELECT * FROM rooms WHERE number = ?', [toNumber]);
    if (!resv || !dest) {
      fail(res, 'Chambre ou séjour introuvable.');
      return true;
    }
    db.run('UPDATE reservations SET room_id = ? WHERE id = ?', [dest.id, id]);
    db.run("UPDATE rooms SET status = 'disponible' WHERE number = ?", [resv.from_room]);
    db.run("UPDATE rooms SET status = 'occupee' WHERE id = ?", [dest.id]);
    db.run(
      'INSERT INTO room_transfers (reservation_id, guest_name, from_room, to_room, reason, at) VALUES (?,?,?,?,?,?)',
      [id, resv.guest_name, resv.from_room, dest.number, body.reason || 'Transfert', stampNow()],
    );
    ok(res, { to: dest.number }, 'Chambre transférée.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/lost-items/return') {
    const body = await readBody(req);
    db.run("UPDATE lost_items SET status = 'restitue', returned_at = ? WHERE id = ?", [day(0), Number(body.id)]);
    ok(res, { id: body.id }, 'Objet restitué.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/housekeeping/status') {
    const body = await readBody(req);
    const room = String(body.room_number || '');
    const taskStatus = String(body.task_status || body.status || 'en_cours');
    const roomStatus = taskStatus === 'pret' ? 'disponible' : 'nettoyage';
    db.run('UPDATE rooms SET status = ? WHERE number = ?', [roomStatus, room]);
    if (body.task_id) db.run('UPDATE hk_tasks SET status = ? WHERE id = ?', [taskStatus, Number(body.task_id)]);
    if (taskStatus === 'pret') {
      db.run(
        `INSERT INTO notifications (category, title, body, href, is_read, created_at)
         VALUES ('ÉTAGES', 'Chambre prête', ?, '/housekeeping', 0, ?)`,
        [`Chambre ${room} nettoyée et prête.`, stampNow()],
      );
    }
    ok(res, { room, status: taskStatus }, 'Statut chambre mis à jour.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/maintenance/close') {
    const body = await readBody(req);
    db.run(
      "UPDATE work_orders SET status = 'clos', closed_at = ?, validated_by = ? WHERE id = ?",
      [stampNow(), body.validated_by || 'Hiérarchie', Number(body.id)],
    );
    if (body.room_number) db.run("UPDATE rooms SET status = 'nettoyage' WHERE number = ?", [body.room_number]);
    ok(res, { id: body.id }, 'Intervention clôturée.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/pos/sale') {
    const body = await readBody(req);
    const total = Number(body.total || 0);
    db.run(
      'INSERT INTO pos_sales (outlet, seller, guest_name, room_number, total, at) VALUES (?,?,?,?,?,?)',
      [body.outlet, body.seller || actor.full_name || 'Caisse', body.guest_name || null, body.room_number || null, total, stampNow()],
    );
    const saleId = db.lastId();
    if (body.item) {
      db.run('INSERT INTO pos_sale_items (sale_id, product_name, qty, price) VALUES (?,?,?,?)', [
        saleId,
        body.item,
        Number(body.qty || 1),
        total,
      ]);
    }
    if (body.room_number && body.guest_name) {
      const resv = db.get(
        `SELECT r.id FROM reservations r JOIN rooms rm ON rm.id = r.room_id
         JOIN guests g ON g.id = r.guest_id
         WHERE rm.number = ? AND g.full_name = ? AND r.status = 'en_cours' LIMIT 1`,
        [body.room_number, body.guest_name],
      );
      db.run(
        'INSERT INTO folio_charges (reservation_id, guest_name, source, label, amount, at, outlet) VALUES (?,?,?,?,?,?,?)',
        [resv ? resv.id : null, body.guest_name, 'pos', body.item || 'Consommation', total, day(0), body.outlet],
      );
    }
    ok(res, { id: saleId }, 'Vente enregistrée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/cash/expense') {
    const body = await readBody(req);
    const session = db.get("SELECT * FROM cash_sessions WHERE status = 'ouverte' ORDER BY id DESC LIMIT 1");
    if (!session) {
      fail(res, 'Aucune caisse ouverte.');
      return true;
    }
    db.run('INSERT INTO cash_lines (session_id, type, label, amount, at) VALUES (?,?,?,?,?)', [
      session.id,
      'expense',
      body.label || 'Dépense',
      Number(body.amount || 0),
      stampNow(),
    ]);
    ok(res, { id: db.lastId() }, 'Dépense enregistrée.');
    return true;
  }

  if (method === 'GET' && pathName === '/pms/desk') {
    const today = day(0);
    const recentRes = db.all(
      `SELECT r.*, g.full_name AS guest_name, rm.number AS room_number
       FROM reservations r JOIN guests g ON g.id = r.guest_id JOIN rooms rm ON rm.id = r.room_id
       WHERE date(r.check_in) = date(?) OR date(r.check_out) = date(?)
       ORDER BY r.check_in DESC LIMIT 8`,
      [today, today],
    );
    ok(res, {
      today,
      reservations: Number(db.get('SELECT COUNT(*) AS n FROM reservations WHERE date(check_in) = date(?)', [today]).n),
      in_house: Number(db.get("SELECT COUNT(*) AS n FROM reservations WHERE status = 'en_cours'").n),
      checkouts: Number(db.get('SELECT COUNT(*) AS n FROM reservations WHERE date(check_out) = date(?)', [today]).n),
      sales_count: Number(db.get('SELECT COUNT(*) AS n FROM pos_sales WHERE date(at) = date(?)', [today]).n),
      sales_amount: Number(db.get('SELECT SUM(total) AS n FROM pos_sales WHERE date(at) = date(?)', [today]).n || 0),
      visits: Number(db.get('SELECT COUNT(*) AS n FROM visits WHERE date(arrived_at) = date(?)', [today]).n),
      badges: Number(db.get("SELECT COUNT(*) AS n FROM client_badges WHERE date(valid_to) >= date('now')").n),
      suggestions_open: Number(db.get("SELECT COUNT(*) AS n FROM suggestions WHERE status = 'ouverte'").n),
      hk_urgent: Number(db.get("SELECT COUNT(*) AS n FROM hk_tasks WHERE priority = 'urgente' AND status != 'pret'").n),
      hk_open: Number(db.get("SELECT COUNT(*) AS n FROM hk_tasks WHERE status IN ('non_prise','en_cours')").n),
      rooms: db.get(
        `SELECT
          SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) AS available,
          SUM(CASE WHEN status = 'occupee' THEN 1 ELSE 0 END) AS occupied,
          SUM(CASE WHEN status = 'nettoyage' THEN 1 ELSE 0 END) AS cleaning,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS blocked
         FROM rooms`,
      ),
      recent_sales: db.all(
        `SELECT s.*, (SELECT product_name FROM pos_sale_items i WHERE i.sale_id = s.id LIMIT 1) AS item
         FROM pos_sales s ORDER BY at DESC LIMIT 6`,
      ),
      recent_res: recentRes,
    });
    return true;
  }

  if (method === 'GET' && pathName === '/pms/workspace') {
    ok(res, {
      badges: db.all('SELECT * FROM client_badges ORDER BY id DESC LIMIT 40'),
      suggestions: db.all('SELECT * FROM suggestions ORDER BY id DESC LIMIT 40'),
      cash: db.all('SELECT * FROM cash_moves ORDER BY id DESC LIMIT 40'),
      shifts: db.all('SELECT * FROM staff_shifts ORDER BY day DESC, start_hour'),
      visits: db.all('SELECT * FROM visits ORDER BY arrived_at DESC LIMIT 40'),
      staff: db.all('SELECT id, full_name, role, department FROM staff WHERE status = ? ORDER BY full_name', ['actif']),
      products: db.all('SELECT * FROM products ORDER BY name'),
      rooms: db.all('SELECT id, number, type, status, price_night FROM rooms ORDER BY number'),
    });
    return true;
  }

  if (method === 'POST' && pathName === '/pms/badges') {
    const body = await readBody(req);
    const code = `MH-${String(body.room_number || '00')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    db.run(
      'INSERT INTO client_badges (guest_name, room_number, valid_from, valid_to, code, created_by) VALUES (?,?,?,?,?,?)',
      [
        body.guest_name,
        body.room_number,
        body.valid_from,
        body.valid_to,
        code,
        body.created_by || actor.full_name || 'Réception',
      ],
    );
    ok(res, { id: db.lastId(), code }, 'Badge généré.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/visits') {
    const body = await readBody(req);
    db.run(
      'INSERT INTO visits (visitor_name, host_name, room_number, purpose, arrived_at, left_at) VALUES (?,?,?,?,?,?)',
      [body.visitor_name, body.host_name, body.room_number, body.purpose || 'Visite', stampNow(), null],
    );
    ok(res, { id: db.lastId() }, 'Visite enregistrée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/suggestions') {
    const body = await readBody(req);
    db.run('INSERT INTO suggestions (author, role, message, status) VALUES (?,?,?,?)', [
      body.author || actor.full_name,
      body.role || actor.role || 'receptionist',
      body.message,
      'ouverte',
    ]);
    ok(res, { id: db.lastId() }, 'Suggestion envoyée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/suggestions/reply') {
    const body = await readBody(req);
    db.run("UPDATE suggestions SET reply = ?, status = 'traitee' WHERE id = ?", [body.reply, Number(body.id)]);
    ok(res, { id: body.id }, 'Réponse enregistrée.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/cash-moves') {
    const body = await readBody(req);
    db.run('INSERT INTO cash_moves (kind, label, amount, actor, at) VALUES (?,?,?,?,?)', [
      body.kind === 'sortie' ? 'sortie' : 'entree',
      body.label,
      Number(body.amount || 0),
      body.actor || actor.full_name || 'Gérance',
      stampNow(),
    ]);
    ok(res, { id: db.lastId() }, 'Mouvement de caisse enregistré.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/shifts') {
    const body = await readBody(req);
    db.run('INSERT INTO staff_shifts (staff_name, day, start_hour, end_hour, task) VALUES (?,?,?,?,?)', [
      body.staff_name,
      body.day,
      body.start_hour,
      body.end_hour,
      body.task || '',
    ]);
    ok(res, { id: db.lastId() }, 'Vacation planifiée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/rooms/save') {
    const body = await readBody(req);
    if (body.id) {
      db.run(
        'UPDATE rooms SET number=?, type=?, floor=?, price_night=?, capacity=?, photo=?, video=?, description=?, status=? WHERE id=?',
        [
          body.number,
          body.type,
          Number(body.floor || 1),
          Number(body.price_night || 0),
          Number(body.capacity || 2),
          body.photo,
          body.video || null,
          body.description || '',
          body.status || 'disponible',
          Number(body.id),
        ],
      );
      ok(res, { id: body.id }, 'Chambre enregistrée.');
      return true;
    }
    db.run(
      'INSERT INTO rooms (number, type, floor, status, price_night, capacity, photo, description, video) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        body.number,
        body.type || 'Standard',
        Number(body.floor || 1),
        'disponible',
        Number(body.price_night || 0),
        Number(body.capacity || 2),
        body.photo || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
        body.description || '',
        body.video || null,
      ],
    );
    ok(res, { id: db.lastId() }, 'Chambre créée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/rooms/delete') {
    const body = await readBody(req);
    db.run('DELETE FROM rooms WHERE id = ?', [Number(body.id)]);
    ok(res, { id: body.id }, 'Chambre supprimée.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/rooms/block') {
    const body = await readBody(req);
    db.run("UPDATE rooms SET status = 'maintenance' WHERE number = ?", [body.room_number]);
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES ('MAINTENANCE', 'Chambre indisponible', ?, '/rooms', 0, ?)`,
      [`Chambre ${body.room_number} placée hors service.`, stampNow()],
    );
    ok(res, { room: body.room_number }, 'Chambre rendue indisponible.');
    return true;
  }

  if (method === 'POST' && pathName === '/pms/housekeeping/urgent') {
    const body = await readBody(req);
    db.run(
      'INSERT INTO hk_tasks (room_number, attendant, priority, status, eta_minutes, due_at) VALUES (?,?,?,?,?,?)',
      [body.room_number, body.attendant || 'Étages', 'urgente', 'non_prise', 20, stampNow()],
    );
    db.run("UPDATE rooms SET status = 'nettoyage' WHERE number = ?", [body.room_number]);
    db.run(
      `INSERT INTO notifications (category, title, body, href, is_read, created_at)
       VALUES ('URGENCE', 'Nettoyage urgent', ?, '/housekeeping', 0, ?)`,
      [`Chambre ${body.room_number} à nettoyer en urgence.`, stampNow()],
    );
    ok(res, { id: db.lastId() }, 'Urgence de nettoyage signalée.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/products') {
    const body = await readBody(req);
    const warehouse = db.get('SELECT id FROM warehouses ORDER BY id LIMIT 1');
    db.run(
      'INSERT INTO products (name, category, unit, stock, min_stock, cost, price, warehouse_id) VALUES (?,?,?,?,?,?,?,?)',
      [
        body.name,
        body.category || 'Divers',
        body.unit || 'u',
        Number(body.stock || 0),
        Number(body.min_stock || 0),
        Number(body.cost || 0),
        Number(body.price || 0),
        warehouse ? warehouse.id : 1,
      ],
    );
    ok(res, { id: db.lastId() }, 'Article ajouté.', 201);
    return true;
  }

  if (method === 'POST' && pathName === '/pms/products/delete') {
    const body = await readBody(req);
    db.run('DELETE FROM products WHERE id = ?', [Number(body.id)]);
    ok(res, { id: body.id }, 'Article supprimé.');
    return true;
  }

  return false;
}

function stampNow() {
  const d = new Date();
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

module.exports = { handlePms, computeKpis };
