const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../utils/db-helpers');
const { logger, errorLogger } = require('../utils/logger');

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

// Get all vendors
router.get('/api', requireLogin, async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT
        v.id,
        v.user_id,
        v.picture,
        v.name,
        v.street,
        v.city,
        v.state,
        v.zipcode,
        v.phone_number,
        v.email,
        v.account_number,
        v.created_at,
        v.updated_at
      FROM vendors v
    `;
    const params = [];

    if (search) {
      query += ` WHERE (
        v.name LIKE ? OR
        v.street LIKE ? OR
        v.city LIKE ? OR
        v.state LIKE ? OR
        v.zipcode LIKE ? OR
        v.phone_number LIKE ? OR
        v.email LIKE ? OR
        v.account_number LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    query += ` ORDER BY v.name COLLATE NOCASE ASC`;
    const vendors = await dbAll(query, params);

    res.json(vendors);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching vendors',
      stack: error.stack,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get single vendor
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;

  try {
    const vendor = await dbGet(
      `SELECT * FROM vendors WHERE id = ?`,
      [id]
    );

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching vendor',
      stack: error.stack,
      vendorId: id
    });
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Create vendor
router.post('/api', requireLogin, async (req, res) => {
  const { picture, name, street, city, state, zipcode, phone_number, email, account_number } = req.body;
  const userId = req.session.userId;

  try {
    if (!name || !street || !city || !state || !zipcode) {
      return res.status(400).json({ error: 'Name, street, city, state, and zipcode are required' });
    }

    // Build full address from components
    const address = `${street}, ${city}, ${state} ${zipcode}`;

    const result = await dbRun(
      `INSERT INTO vendors
        (user_id, picture, name, street, city, state, zipcode, address, phone_number, email, account_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, picture || null, name, street, city, state, zipcode, address, phone_number || null, email || null, account_number || null]
    );

    logger.info('Vendor created', {
      userId,
      vendorId: result.lastID,
      name
    });

    res.status(201).json({ id: result.lastID, message: 'Vendor created' });
  } catch (error) {
    errorLogger.error({
      message: 'Error creating vendor',
      stack: error.stack,
      method: 'POST',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { picture, name, street, city, state, zipcode, phone_number, email, account_number } = req.body;

  try {
    const vendor = await dbGet('SELECT * FROM vendors WHERE id = ?', [id]);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Build full address from components
    const address = `${street}, ${city}, ${state} ${zipcode}`;

    await dbRun(
      `UPDATE vendors
       SET picture = ?,
           name = ?,
           street = ?,
           city = ?,
           state = ?,
           zipcode = ?,
           address = ?,
           phone_number = ?,
           email = ?,
           account_number = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [picture || null, name, street, city, state, zipcode, address, phone_number || null, email || null, account_number || null, id]
    );

    logger.info('Vendor updated', { vendorId: id });
    res.json({ message: 'Vendor updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating vendor',
      stack: error.stack,
      vendorId: id
    });
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Delete vendor
router.delete('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;

  try {
    const vendor = await dbGet('SELECT * FROM vendors WHERE id = ?', [id]);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await dbRun('DELETE FROM vendors WHERE id = ?', [id]);
    logger.info('Vendor deleted', { vendorId: id });
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting vendor',
      stack: error.stack,
      vendorId: id
    });
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;
