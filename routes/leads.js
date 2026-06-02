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

async function pruneOldLeads() {
  try {
    await dbRun(`DELETE FROM leads WHERE created_at < datetime('now', '-30 days')`);
  } catch (error) {
    logger.info('Failed to prune old leads', { error: error.message });
  }
}

function renderExternalContactResponse(res, status, title, message) {
  res.status(status).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f5f7fb; color:#222; margin:0; padding:0; }
    .page { max-width: 760px; margin: 60px auto; padding: 24px; background: #fff; border-radius: 10px; box-shadow: 0 16px 40px rgba(0,0,0,.08); }
    h1 { margin-top: 0; font-size: 28px; }
    p { line-height: 1.6; }
    a { color: #0073e6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="page">
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/contact.php">Return to Contact Form</a></p>
  </div>
</body>
</html>`);
}

// Public contact form API endpoint
router.post('/leads/contact', async (req, res) => {
  const { name, phone_number, email, message, token, redirect_to } = req.body;
  const headerToken = req.headers['x-lead-form-token'];
  const referer = req.headers.referer || '';
  const redirectTo = redirect_to || referer || '/contact.php';
  const isExternalContactForm = referer.includes('/contact.php') || Boolean(redirect_to);

  const expectedToken = await getSetting('lead_form_token', null);
  if (!expectedToken || (token !== expectedToken && headerToken !== expectedToken)) {
    if (isExternalContactForm) {
      return renderExternalContactResponse(
        res,
        403,
        'Contact Submission Failed',
        'Invalid or missing contact form token. Please contact the site administrator.'
      );
    }

    return res.status(403).render('contact', {
      message: 'Invalid or missing contact form token. Please contact the site administrator.'
    });
  }

  if (!name || !email || !message) {
    if (isExternalContactForm) {
      return renderExternalContactResponse(
        res,
        400,
        'Contact Submission Failed',
        'Please provide your name, email, and message.'
      );
    }

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

    if (isExternalContactForm) {
      return res.status(303).redirect(redirectTo);
    }

    res.render('contact', {
      success: 'Thank you! Your message has been received and will be reviewed shortly.'
    });
  } catch (error) {
    errorLogger.error({
      message: 'Error submitting contact form',
      stack: error.stack,
      email
    });

    if (isExternalContactForm) {
      return renderExternalContactResponse(
        res,
        500,
        'Contact Submission Failed',
        'There was an error sending your message. Please try again later.'
      );
    }

    res.status(500).render('contact', {
      message: 'There was an error sending your message. Please try again later.'
    });
  }
});

// Lead management API for dashboard
router.get('/leads/api', requireLogin, requirePermission('can_leads'), async (req, res) => {
  try {
    await pruneOldLeads();
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

router.delete('/leads/api/:id', requireLogin, requirePermission('can_leads'), async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await dbGet('SELECT id FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await dbRun('DELETE FROM leads WHERE id = ?', [id]);
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting lead',
      stack: error.stack,
      leadId: id,
      userId: req.session.userId
    });
    res.status(500).json({ error: 'Failed to delete lead' });
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
