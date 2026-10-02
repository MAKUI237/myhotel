function intervalUnit(unit) {
  const key = String(unit || '').toLowerCase().replace(/s$/, '');
  if (key === 'minute') return 'MINUTE';
  if (key === 'hour') return 'HOUR';
  if (key === 'day') return 'DAY';
  return 'DAY';
}

function translateSql(sql) {
  let s = String(sql);
  s = s.replace(/INTEGER PRIMARY KEY CHECK \(id = 1\)/gi, 'INT NOT NULL PRIMARY KEY');
  s = s.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
  s = s.replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT');
  s = s.replace(/DEFAULT \(datetime\('now'\)\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  s = s.replace(/datetime\('now'\s*,\s*'([+-]?\d+)\s+(minutes?|hours?|days?)'\)/gi, (_, n, unit) => {
    return `DATE_ADD(NOW(), INTERVAL ${n} ${intervalUnit(unit)})`;
  });
  s = s.replace(/date\('now'\s*,\s*'([+-]?\d+)\s+(days?)'\)/gi, (_, n) => `DATE_ADD(CURDATE(), INTERVAL ${n} DAY)`);
  s = s.replace(/datetime\('now'\)/gi, 'NOW()');
  s = s.replace(/date\('now'\)/gi, 'CURDATE()');
  s = s.replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
  s = s.replace(/INSERT OR REPLACE INTO/gi, 'REPLACE INTO');
  s = s.replace(/\bREAL\b/g, 'DOUBLE');
  s = s.replace(/PRAGMA foreign_keys\s*=\s*ON;?/gi, 'SELECT 1');
  s = s.replace(/SELECT last_insert_rowid\(\) AS id/gi, 'SELECT LAST_INSERT_ID() AS id');
  s = s.replace(/\bTEXT NOT NULL UNIQUE\b/gi, 'VARCHAR(191) NOT NULL UNIQUE');
  s = s.replace(/\bTEXT UNIQUE\b/gi, 'VARCHAR(191) UNIQUE');
  s = s.replace(/\bTEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\b/gi, 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
  s = s.replace(/\bTEXT NOT NULL DEFAULT\b/gi, 'VARCHAR(191) NOT NULL DEFAULT');
  s = s.replace(/\bTEXT DEFAULT\b/gi, 'VARCHAR(191) DEFAULT');
  s = s.replace(/VARCHAR\(191\) NOT NULL DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
  s = s.replace(/\bTEXT PRIMARY KEY\b/gi, 'VARCHAR(191) PRIMARY KEY');
  s = s.replace(/CREATE TABLE IF NOT EXISTS app_meta \(key VARCHAR\(191\) PRIMARY KEY/gi, 'CREATE TABLE IF NOT EXISTS app_meta (`key` VARCHAR(191) PRIMARY KEY');
  s = s.replace(/CREATE TABLE IF NOT EXISTS app_meta \(key TEXT PRIMARY KEY/gi, 'CREATE TABLE IF NOT EXISTS app_meta (`key` VARCHAR(191) PRIMARY KEY');
  s = s.replace(/INTO app_meta \(key, value\)/gi, 'INTO app_meta (`key`, value)');
  s = s.replace(/FROM app_meta WHERE key =/gi, 'FROM app_meta WHERE `key` =');
  s = s.replace(/app_meta WHERE key =/gi, 'app_meta WHERE `key` =');
  s = s.replace(/\bdatetime\(([a-z_][a-z0-9_]*)\)/gi, '$1');
  s = s.replace(
    /SELECT id FROM \(\s*SELECT MAX\(id\) AS id FROM hk_tasks WHERE status NOT IN \('pret','termine','controle'\) GROUP BY room_number\s*\)/gi,
    "SELECT id FROM (SELECT MAX(id) AS id FROM hk_tasks WHERE status NOT IN ('pret','termine','controle') GROUP BY room_number) AS hk_keep",
  );
  return s;
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'bigint') out[key] = Number(value);
    else if (Buffer.isBuffer(value)) out[key] = value.toString('utf8');
    else out[key] = value;
  }
  return out;
}

module.exports = { translateSql, normalizeRow };
