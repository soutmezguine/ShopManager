const { getDb } = require('../config/database');

// Wrapper for database queries with error handling
function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

module.exports = {
  dbRun,
  dbGet,
  dbAll
};
