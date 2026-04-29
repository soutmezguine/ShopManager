const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger, errorLogger } = require('../utils/logger');

const dbPath = path.join(__dirname, '../data/shopmanager.db');
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
  db.serialize(() => {
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
      } else {
        logger.info('Users table initialized');
      }
    });

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
      } else {
        logger.info('Appointments table initialized');
      }
    });

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        errorLogger.error({ message: 'Error creating parts_orders table', error: err.message });
      } else {
        logger.info('Parts orders table initialized');
      }
    });

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
      } else {
        logger.info('Todos table initialized');
      }
    });

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
      } else {
        logger.info('Error logs table initialized');
      }
    });
  });
}

function getDb() {
  return db;
}

module.exports = {
  getDb,
  initializeDatabase
};
