const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase } = require('./config/database');
const { dbGet } = require('./utils/db-helpers');
const { errorLogger, logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'shop-manager-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    // Run additional safety checks and migrations (non-blocking but awaited)
    try {
      const { ensureAdminAndMigrations } = require('./scripts/ensure_admin');
      await ensureAdminAndMigrations();
    } catch (e) {
      logger.info('Could not run ensure_admin checks', { error: e.message });
    }
    
    // Routes
    app.use('/auth', require('./routes/auth'));
    app.use('/appointments', require('./routes/appointments'));
    app.use('/parts', require('./routes/parts'));
    app.use('/returns', require('./routes/returns'));
    app.use('/vendors', require('./routes/vendors'));
    app.use('/todo', require('./routes/todo'));
    app.use('/', require('./routes/leads'));

    // Main dashboard
    app.get('/', async (req, res, next) => {
      if (!req.session.userId) {
        return res.redirect('/auth/login');
      }

      try {
        const user = await dbGet(
          'SELECT is_admin, can_appointments, can_parts, can_vendors, can_leads FROM users WHERE id = ?',
          [req.session.userId]
        );

        res.render('dashboard', {
          userName: req.session.userName,
          userId: req.session.userId,
          isAdmin: !!user?.is_admin,
          permissions: {
            can_appointments: user?.can_appointments === 1,
            can_parts: user?.can_parts === 1,
            can_vendors: user?.can_vendors === 1,
            can_leads: user?.can_leads === 1
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).render('404', { 
        message: 'Page not found' 
      });
    });

    // Error handler middleware
    app.use((err, req, res, next) => {
      errorLogger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        userId: req.session?.userId || 'unknown'
      });
      
      res.status(err.status || 500).render('error', { 
        message: err.message || 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    });

    app.listen(PORT, () => {
      logger.info(`Shop Manager server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    errorLogger.error({
      message: 'Failed to initialize database',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();
