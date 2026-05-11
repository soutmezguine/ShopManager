const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger, errorLogger } = require('../utils/logger');

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'shopmanager.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  logger.info(`Created database directory: ${dataDir}`);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    errorLogger.error({ message: 'Database connection failed', error: err.message });
  } else {
    logger.info('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          errorLogger.error({ message: 'Error enabling foreign keys', error: err.message });
          reject(err);
          return;
        }

        // Users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
          )
        `, (err) => {
          if (err) {
            errorLogger.error({ message: 'Error creating users table', error: err.message });
            reject(err);
            return;
          }

          // Appointments table
          db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              appointment_date DATE NOT NULL,
              appointment_time TIME NOT NULL,
              customer_name TEXT NOT NULL,
              phone_number TEXT,
              vehicle_year INTEGER,
              vehicle_make TEXT,
              vehicle_model TEXT,
              service_required TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
          `, (err) => {
            if (err) {
              errorLogger.error({ message: 'Error creating appointments table', error: err.message });
              reject(err);
              return;
            }

            // Parts orders table
            db.run(`
              CREATE TABLE IF NOT EXISTS parts_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                order_date DATE NOT NULL,
                ro TEXT NOT NULL,
                parts_ordered TEXT NOT NULL,
                vendor TEXT NOT NULL,
                arrival_date DATE,
                cost DECIMAL(10, 2),
                check_number TEXT,
                rep_name TEXT,
                status TEXT DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
              )
            `, (err) => {
              if (err) {
                errorLogger.error({ message: 'Error creating parts_orders table', error: err.message });
                reject(err);
                return;
              }

              // Returns table
              db.run(`
                CREATE TABLE IF NOT EXISTS returns_orders (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  return_date DATE NOT NULL,
                  parts_returned TEXT NOT NULL,
                  vendor TEXT NOT NULL,
                  status TEXT DEFAULT 'Pending',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id)
                )
              `, (err) => {
                if (err) {
                  errorLogger.error({ message: 'Error creating returns_orders table', error: err.message });
                  reject(err);
                  return;
                }

                // Vendors table
                db.run(`
                  CREATE TABLE IF NOT EXISTS vendors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    picture TEXT,
                    name TEXT NOT NULL,
                    street TEXT,
                    city TEXT,
                    state TEXT,
                    zipcode TEXT,
                    address TEXT,
                    phone_number TEXT,
                    email TEXT,
                    account_number TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                  )
                `, (err) => {
                  if (err) {
                    errorLogger.error({ message: 'Error creating vendors table', error: err.message });
                    reject(err);
                    return;
                  }

                  // Add new columns to existing vendors table if they don't exist
                  const addColumnsIfNotExist = () => {
                    db.all(`PRAGMA table_info(vendors)`, (err, rows) => {
                      if (err) {
                        logger.info('Could not check vendors table columns');
                        continueWithTodos();
                        return;
                      }
                      const columnNames = rows.map(row => row.name);
                      if (!columnNames.includes('street')) {
                        db.run(`ALTER TABLE vendors ADD COLUMN street TEXT`, (err) => {
                          if (err) logger.info('Column street already exists or error adding it');
                        });
                      }
                      if (!columnNames.includes('city')) {
                        db.run(`ALTER TABLE vendors ADD COLUMN city TEXT`, (err) => {
                          if (err) logger.info('Column city already exists or error adding it');
                        });
                      }
                      if (!columnNames.includes('state')) {
                        db.run(`ALTER TABLE vendors ADD COLUMN state TEXT`, (err) => {
                          if (err) logger.info('Column state already exists or error adding it');
                        });
                      }
                      if (!columnNames.includes('zipcode')) {
                        db.run(`ALTER TABLE vendors ADD COLUMN zipcode TEXT`, (err) => {
                          if (err) logger.info('Column zipcode already exists or error adding it');
                        });
                      }
                      continueWithTodos();
                    });
                  };

                  const continueWithTodos = () => {
                    // Todo list table
                    db.run(`
                      CREATE TABLE IF NOT EXISTS todos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        task_text TEXT NOT NULL,
                        completed BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                      )
                    `, (err) => {
                      if (err) {
                        errorLogger.error({ message: 'Error creating todos table', error: err.message });
                        reject(err);
                        return;
                      }

                      // Error logs table
                      db.run(`
                        CREATE TABLE IF NOT EXISTS error_logs (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          level TEXT,
                          message TEXT,
                          stack TEXT,
                          user_id INTEGER,
                          additional_info TEXT,
                          logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                      `, (err) => {
                        if (err) {
                          errorLogger.error({ message: 'Error creating error_logs table', error: err.message });
                          reject(err);
                          return;
                        }

                        logger.info('Database tables initialized successfully');
                        resolve();
                      });
                    });
                  };

                  addColumnsIfNotExist();
                });
              });
            });
          });
        });
      });
    } catch (error) {
      errorLogger.error({ message: 'Database initialization failed', error: error.message });
      reject(error);
    }
  });
}

function getDb() {
  return db;
}

module.exports = {
  getDb,
  initializeDatabase
};
