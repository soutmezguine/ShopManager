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
        v.*,
        u.full_name as created_by_name,
        u.username as created_by_username
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE (
        v.name LIKE ? OR
        v.address LIKE ? OR
        v.phone_number LIKE ? OR
        v.email LIKE ? OR
        v.account_number LIKE ? OR
        u.full_name LIKE ? OR
        u.username LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term);
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
      `SELECT
         v.*,
         u.full_name as created_by_name,
         u.username as created_by_username
       FROM vendors v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
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
  const { picture, name, address, phone_number, email, account_number } = req.body;
  const userId = req.session.userId;

  try {
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    const result = await dbRun(
      `INSERT INTO vendors
        (user_id, picture, name, address, phone_number, email, account_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, picture || null, name, address, phone_number || null, email || null, account_number || null]
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
  const { picture, name, address, phone_number, email, account_number } = req.body;

  try {
    const vendor = await dbGet('SELECT * FROM vendors WHERE id = ?', [id]);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await dbRun(
      `UPDATE vendors
       SET picture = ?,
           name = ?,
           address = ?,
           phone_number = ?,
           email = ?,
           account_number = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [picture || null, name, address, phone_number || null, email || null, account_number || null, id]
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
