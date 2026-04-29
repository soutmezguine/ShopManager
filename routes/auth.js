const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { dbRun, dbGet } = require('../utils/db-helpers');
const { logger, errorLogger } = require('../utils/logger');

// Register page
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Register user
router.post('/register', async (req, res) => {
  const { username, password, passwordConfirm, fullName } = req.body;

  try {
    if (!username || !password || !passwordConfirm || !fullName) {
      return res.status(400).render('auth/register', {
        message: 'Please provide all required fields'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render('auth/register', {
        message: 'Passwords do not match'
      });
    }

    // Check if user exists
    const existingUser = await dbGet('SELECT username FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).render('auth/register', {
        message: 'Username already in use'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insert user
    await dbRun(
      'INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)',
      [username, hashedPassword, fullName]
    );

    logger.info('New user registered', { username, fullName });

    return res.status(201).render('auth/register', {
      message: 'User registered successfully!'
    });
  } catch (error) {
    errorLogger.error({
      message: 'Registration error',
      stack: error.stack,
      userId: 'registration-attempt'
    });
    return res.status(500).render('auth/register', {
      message: 'An error occurred during registration'
    });
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).render('auth/login', {
        message: 'Please provide username and password'
      });
    }

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('auth/login', {
        message: 'Username or password is incorrect'
      });
    }

    // Update last login
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Store session
    req.session.userId = user.id;
    req.session.userName = user.full_name;

    logger.info('User logged in', { userId: user.id, username: user.username });

    return res.redirect('/');
  } catch (error) {
    errorLogger.error({
      message: 'Login error',
      stack: error.stack,
      userId: username || 'unknown'
    });
    return res.status(500).render('auth/login', {
      message: 'An error occurred during login'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  logger.info('User logged out', { userId: req.session.userId });
  req.session.destroy((err) => {
    if (err) {
      errorLogger.error({ message: 'Session destroy error', stack: err.stack });
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
