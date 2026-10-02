let handler;

function fail(res, error, status = 500) {
  const payload = JSON.stringify({ ok: false, error });
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  });
  res.end(payload);
}

module.exports = async function myhotelApi(req, res) {
  try {
    if (!handler) {
      const { openDatabase, createRequestHandler } = require('../server/index');
      const db = await openDatabase();
      handler = createRequestHandler(db);
    }
    await handler(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.';
    fail(res, /connect|mysql|access denied|enotfound|etimedout/i.test(message)
      ? 'Base MySQL inaccessible. Vérifiez MYSQL_URL (ou MYHOTEL_MYSQL_*) sur Vercel.'
      : message);
  }
};
