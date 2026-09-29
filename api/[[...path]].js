let handler;

module.exports = async function myhotelApi(req, res) {
  if (!handler) {
    const { openDatabase, createRequestHandler } = require('../server/index');
    const db = await openDatabase();
    handler = createRequestHandler(db);
  }
  await handler(req, res);
};
