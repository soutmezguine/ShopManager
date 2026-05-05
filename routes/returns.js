const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../utils/db-helpers');
const { logger, errorLogger } = require('../utils/logger');

// Middleware to check authentication
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

// Get all returns (shared across all users)
router.get('/api', requireLogin, async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT
        r.*,
        u.full_name as created_by_name,
        u.username as created_by_username
      FROM returns_orders r
      LEFT JOIN users u ON r.user_id = u.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE (
        r.vendor LIKE ? OR
        r.parts_returned LIKE ? OR
        r.status LIKE ? OR
        u.full_name LIKE ? OR
        u.username LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY
      CASE r.status
        WHEN 'Pending' THEN 0
        WHEN 'Picked Up' THEN 1
        ELSE 2
      END,
      r.return_date DESC`;

    const returnsOrders = await dbAll(query, params);
    res.json(returnsOrders);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching returns',
      stack: error.stack,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Get single return
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;

  try {
    const returnOrder = await dbGet(
      `SELECT
         r.*,
         u.full_name as created_by_name,
         u.username as created_by_username
       FROM returns_orders r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    res.json(returnOrder);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching return',
      stack: error.stack,
      returnId: id
    });
    res.status(500).json({ error: 'Failed to fetch return' });
  }
});

// Create return
router.post('/api', requireLogin, async (req, res) => {
  const { returnDate, vendor, partsReturned, status } = req.body;
  const userId = req.session.userId;

  try {
    if (!returnDate || !vendor || !partsReturned) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT INTO returns_orders
         (user_id, return_date, vendor, parts_returned, status)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, returnDate, vendor, partsReturned, status || 'Pending']
    );

    logger.info('Return created', {
      userId,
      vendor,
      returnId: result.lastID
    });

    res.status(201).json({ id: result.lastID, message: 'Return created' });
  } catch (error) {
    errorLogger.error({
      message: 'Error creating return',
      stack: error.stack,
      userId,
      method: 'POST',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to create return' });
  }
});

// Update return
router.put('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { returnDate, vendor, partsReturned, status } = req.body;

  try {
    const returnOrder = await dbGet('SELECT * FROM returns_orders WHERE id = ?', [id]);

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    await dbRun(
      `UPDATE returns_orders
       SET return_date = ?, vendor = ?, parts_returned = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [returnDate, vendor, partsReturned, status || 'Pending', id]
    );

    logger.info('Return updated', { returnId: id });
    res.json({ message: 'Return updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating return',
      stack: error.stack,
      returnId: id
    });
    res.status(500).json({ error: 'Failed to update return' });
  }
});

// Delete return
router.delete('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;

  try {
    const returnOrder = await dbGet('SELECT * FROM returns_orders WHERE id = ?', [id]);

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    await dbRun('DELETE FROM returns_orders WHERE id = ?', [id]);
    logger.info('Return deleted', { returnId: id });

    res.json({ message: 'Return deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting return',
      stack: error.stack,
      returnId: id
    });
    res.status(500).json({ error: 'Failed to delete return' });
  }
});

module.exports = router;
