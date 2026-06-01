const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../utils/db-helpers');
const { logger, errorLogger } = require('../utils/logger');

async function getSetting(name, defaultValue = null) {
  const row = await dbGet('SELECT value FROM settings WHERE name = ?', [name]);
  return row ? row.value : defaultValue;
}

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

const requirePermission = (permissionField) => async (req, res, next) => {
  try {
    const user = await dbGet(
      `SELECT ${permissionField} FROM users WHERE id = ?`,
      [req.session.userId]
    );
    if (!user || user[permissionField] !== 1) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  } catch (error) {
    errorLogger.error({
      message: 'Permission check error',
      stack: error.stack,
      userId: req.session.userId,
      permission: permissionField
    });
    res.status(500).json({ error: 'Permission check failed' });
  }
};

// Public contact form page
router.get('/contact', async (req, res) => {
  try {
    const token = await getSetting('lead_form_token', null);
    res.render('contact', { formToken: token });
  } catch (error) {
    errorLogger.error({
      message: 'Error loading contact page',
      stack: error.stack
    });
    res.render('contact', { message: 'Unable to load contact form at this time.' });
  }
});

// Public contact form API endpoint
router.post('/leads/contact', async (req, res) => {
  const { name, phone_number, email, message, token } = req.body;
  const headerToken = req.headers['x-lead-form-token'];

  const expectedToken = await getSetting('lead_form_token', null);
  if (!expectedToken || (token !== expectedToken && headerToken !== expectedToken)) {
    return res.status(403).render('contact', {
      message: 'Invalid or missing contact form token. Please contact the site administrator.'
    });
  }

  if (!name || !email || !message) {
    return res.status(400).render('contact', {
      message: 'Please provide your name, email, and message.'
    });
  }

  try {
    await dbRun(
      `INSERT INTO leads (customer_name, phone_number, email, message) VALUES (?, ?, ?, ?)`,
      [name, phone_number || null, email, message]
    );

    logger.info('New lead submitted', {
      name,
      email,
      phone_number: phone_number || null
    });

    res.render('contact', {
      success: 'Thank you! Your message has been received and will be reviewed shortly.'
    });
  } catch (error) {
    errorLogger.error({
      message: 'Error submitting contact form',
      stack: error.stack,
      email
    });
    res.status(500).render('contact', {
      message: 'There was an error sending your message. Please try again later.'
    });
  }
});

// Lead management API for dashboard
router.get('/leads/api', requireLogin, requirePermission('can_leads'), async (req, res) => {
  try {
    const leads = await dbAll(`SELECT * FROM leads ORDER BY created_at DESC`);
    res.json(leads);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching leads',
      stack: error.stack,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.put('/leads/api/:id/contacted', requireLogin, requirePermission('can_leads'), async (req, res) => {
  const { id } = req.params;
  const { contacted } = req.body;

  try {
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbRun(
      'UPDATE leads SET contacted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [contacted ? 1 : 0, id]
    );

    res.json({ message: 'Lead updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating lead',
      stack: error.stack,
      leadId: id,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

module.exports = router;
