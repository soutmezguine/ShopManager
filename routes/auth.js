const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../utils/db-helpers');
const { logger, errorLogger } = require('../utils/logger');

async function getSetting(name, defaultValue = '1') {
  const row = await dbGet('SELECT value FROM settings WHERE name = ?', [name]);
  return row ? row.value : defaultValue;
}

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await dbGet('SELECT is_admin FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    errorLogger.error({
      message: 'Admin authorization error',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Register page
router.get('/register', async (req, res) => {
  const allowRegistration = await getSetting('allow_registration', '1') === '1';
  res.render('auth/register', { allowRegistration });
});

// Register user
router.post('/register', async (req, res) => {
  const { username, password, passwordConfirm, fullName } = req.body;
  const allowRegistration = await getSetting('allow_registration', '1') === '1';

  if (!allowRegistration) {
    return res.status(403).render('auth/register', {
      allowRegistration,
      message: 'Registration is currently disabled.'
    });
  }

  try {
    if (!username || !password || !passwordConfirm || !fullName) {
      return res.status(400).render('auth/register', {
        allowRegistration,
        message: 'Please provide all required fields'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render('auth/register', {
        allowRegistration,
        message: 'Passwords do not match'
      });
    }

    const existingUser = await dbGet('SELECT username FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).render('auth/register', {
        allowRegistration,
        message: 'Username already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    await dbRun(
      'INSERT INTO users (username, password, full_name, can_access_admin, can_appointments, can_parts, can_vendors, can_leads) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, fullName, 0, 1, 1, 1, 1]
    );

    logger.info('New user registered', { username, fullName });

    return res.status(201).render('auth/register', {
      allowRegistration,
      message: 'User registered successfully!'
    });
  } catch (error) {
    errorLogger.error({
      message: 'Registration error',
      stack: error.stack,
      userId: 'registration-attempt'
    });
    return res.status(500).render('auth/register', {
      allowRegistration,
      message: 'An error occurred during registration'
    });
  }
});

// Login page
router.get('/login', async (req, res) => {
  const allowRegistration = await getSetting('allow_registration', '1') === '1';
  res.render('auth/login', { allowRegistration });
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

router.get('/admin/settings', requireLogin, requireAdmin, async (req, res) => {
  try {
    const allowRegistration = await getSetting('allow_registration', '1') === '1';
    res.json({ allowRegistration });
  } catch (error) {
    errorLogger.error({
      message: 'Error loading admin settings',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to load settings' });
  }
});

router.put('/admin/settings/registration', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { allowRegistration } = req.body;
    await dbRun(
      'INSERT OR REPLACE INTO settings (name, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['allow_registration', allowRegistration ? '1' : '0']
    );
    res.json({ message: 'Registration setting updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating registration setting',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to update registration setting' });
  }
});

router.get('/admin/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT id, username, full_name, is_admin, can_access_admin, can_appointments, can_parts, can_vendors, can_leads, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    errorLogger.error({
      message: 'Error loading users',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to load users' });
  }
});

router.post('/admin/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, is_admin, can_access_admin, can_appointments, can_parts, can_vendors, can_leads } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, full name, and password are required' });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    await dbRun(
      `INSERT INTO users (
        username, password, full_name, is_admin, can_access_admin, can_appointments, can_parts, can_vendors, can_leads
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        fullName,
        is_admin ? 1 : 0,
        can_access_admin ? 1 : 0,
        can_appointments ? 1 : 0,
        can_parts ? 1 : 0,
        can_vendors ? 1 : 0,
        can_leads ? 1 : 0
      ]
    );
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    errorLogger.error({
      message: 'Error adding user',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to create user' });
  }
});

router.put('/admin/users/:id/permissions', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      is_admin,
      can_access_admin,
      can_appointments,
      can_parts,
      can_vendors,
      can_leads
    } = req.body;

    await dbRun(
      `UPDATE users SET
         is_admin = ?,
         can_access_admin = ?,
         can_appointments = ?,
         can_parts = ?,
         can_vendors = ?,
         can_leads = ?,
         last_login = last_login
       WHERE id = ?`,
      [
        is_admin ? 1 : 0,
        can_access_admin ? 1 : 0,
        can_appointments ? 1 : 0,
        can_parts ? 1 : 0,
        can_vendors ? 1 : 0,
        can_leads ? 1 : 0,
        id
      ]
    );
    res.json({ message: 'User permissions updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating user permissions',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to update permissions' });
  }
});

router.put('/admin/users/:id/reset-password', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    errorLogger.error({
      message: 'Error resetting password',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to reset password' });
  }
});

router.delete('/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting user',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Unable to delete user' });
  }
});

module.exports = router;
