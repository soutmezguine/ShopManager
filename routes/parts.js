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

// Get all parts orders (shared across all users)
router.get('/api', requireLogin, async (req, res) => {
  const { search } = req.query;

  try {
    // Delete orders older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await dbRun(
      'DELETE FROM parts_orders WHERE order_date < ?',
      [sixMonthsAgo.toISOString().split('T')[0]]
    );

    // Get orders not older than 2 months with user information
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    let query = `
      SELECT 
        p.*,
        u.full_name as ordered_by_name,
        u.username as ordered_by_username
      FROM parts_orders p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.order_date >= ?
    `;
    let params = [twoMonthsAgo.toISOString().split('T')[0]];

    if (search) {
      query += ` AND (p.ro LIKE ? OR p.parts_ordered LIKE ? OR p.vendor LIKE ? OR p.check_number LIKE ? OR p.rep_name LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY p.order_date DESC';

    const orders = await dbAll(query, params);
    res.json(orders);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching parts orders',
      stack: error.stack,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch parts orders' });
  }
});

// Get single parts order
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await dbGet(
      `SELECT 
        p.*,
        u.full_name as ordered_by_name,
        u.username as ordered_by_username
      FROM parts_orders p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching parts order',
      stack: error.stack,
      orderId: id
    });
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create parts order
router.post('/api', requireLogin, async (req, res) => {
  const { orderDate, ro, partsOrdered, vendor, arrivalDate, cost, checkNumber, repName, status } = req.body;
  const userId = req.session.userId;

  try {
    if (!orderDate || !ro || !partsOrdered || !vendor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT INTO parts_orders 
        (user_id, order_date, ro, parts_ordered, vendor, arrival_date, cost, check_number, rep_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, orderDate, ro, partsOrdered, vendor, arrivalDate || null, cost || null, checkNumber || null, repName || null, status || 'Pending']
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
  const { orderDate, ro, partsOrdered, vendor, arrivalDate, cost, checkNumber, repName, status } = req.body;

  try {
    const order = await dbGet(
      'SELECT * FROM parts_orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun(
      `UPDATE parts_orders 
       SET order_date = ?, ro = ?, parts_ordered = ?, vendor = ?, arrival_date = ?, cost = ?, check_number = ?, rep_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderDate, ro, partsOrdered, vendor, arrivalDate || null, cost || null, checkNumber || null, repName || null, status || 'Pending', id]
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
      'SELECT * FROM parts_orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun('DELETE FROM parts_orders WHERE id = ?', [id]);

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
