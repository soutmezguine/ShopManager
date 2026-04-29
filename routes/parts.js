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

// Get all parts orders for user (excluding old ones)
router.get('/api', requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { search } = req.query;

  try {
    // Delete orders older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await dbRun(
      'DELETE FROM parts_orders WHERE user_id = ? AND order_date < ?',
      [userId, sixMonthsAgo.toISOString().split('T')[0]]
    );

    // Get orders not older than 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    let query = `
      SELECT * FROM parts_orders 
      WHERE user_id = ? AND order_date >= ?
    `;
    let params = [userId, twoMonthsAgo.toISOString().split('T')[0]];

    if (search) {
      query += ` AND (ro LIKE ? OR parts_ordered LIKE ? OR vendor LIKE ? OR check_number LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY order_date DESC';

    const orders = await dbAll(query, params);
    res.json(orders);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching parts orders',
      stack: error.stack,
      userId,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch parts orders' });
  }
});

// Get single parts order
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const order = await dbGet(
      'SELECT * FROM parts_orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching parts order',
      stack: error.stack,
      userId,
      orderId: id
    });
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create parts order
router.post('/api', requireLogin, async (req, res) => {
  const { orderDate, ro, partsOrdered, vendor, arrivalDate, cost, checkNumber } = req.body;
  const userId = req.session.userId;

  try {
    if (!orderDate || !ro || !partsOrdered || !vendor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT INTO parts_orders 
        (user_id, order_date, ro, parts_ordered, vendor, arrival_date, cost, check_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, orderDate, ro, partsOrdered, vendor, arrivalDate || null, cost || null, checkNumber || null]
    );

    logger.info('Parts order created', {
      userId,
      ro,
      vendor,
      orderId: result.lastID
    });

    res.status(201).json({ id: result.lastID, message: 'Order created' });
  } catch (error) {
    errorLogger.error({
      message: 'Error creating parts order',
      stack: error.stack,
      userId,
      method: 'POST',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update parts order
router.put('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const { orderDate, ro, partsOrdered, vendor, arrivalDate, cost, checkNumber } = req.body;

  try {
    const order = await dbGet(
      'SELECT * FROM parts_orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun(
      `UPDATE parts_orders 
       SET order_date = ?, ro = ?, parts_ordered = ?, vendor = ?, arrival_date = ?, cost = ?, check_number = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [orderDate, ro, partsOrdered, vendor, arrivalDate || null, cost || null, checkNumber || null, id, userId]
    );

    logger.info('Parts order updated', { userId, orderId: id, ro });

    res.json({ message: 'Order updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating parts order',
      stack: error.stack,
      userId,
      orderId: id
    });
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete parts order
router.delete('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const order = await dbGet(
      'SELECT * FROM parts_orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun('DELETE FROM parts_orders WHERE id = ? AND user_id = ?', [id, userId]);

    logger.info('Parts order deleted', { userId, orderId: id });

    res.json({ message: 'Order deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting parts order',
      stack: error.stack,
      userId,
      orderId: id
    });
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
