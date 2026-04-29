const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase } = require('./config/database');
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
    
    // Routes
    app.use('/auth', require('./routes/auth'));
    app.use('/appointments', require('./routes/appointments'));
    app.use('/parts', require('./routes/parts'));
    app.use('/todo', require('./routes/todo'));

    // Main dashboard
    app.get('/', (req, res) => {
      if (!req.session.userId) {
        return res.redirect('/auth/login');
      }
      res.render('dashboard', { 
        userName: req.session.userName,
        userId: req.session.userId 
      });
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
