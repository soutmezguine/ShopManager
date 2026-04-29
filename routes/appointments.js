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

// Get appointments for a specific date or date range
router.get('/api/:viewType', requireLogin, async (req, res) => {
  const { viewType } = req.params;
  const { date } = req.query;
  const userId = req.session.userId;

  try {
    let query = 'SELECT * FROM appointments WHERE user_id = ?';
    let params = [userId];

    if (viewType === 'daily' && date) {
      query += ' AND appointment_date = ?';
      params.push(date);
    } else if (viewType === 'weekly' && date) {
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      query += ' AND appointment_date BETWEEN ? AND ?';
      params.push(startDate.toISOString().split('T')[0]);
      params.push(endDate.toISOString().split('T')[0]);
    } else if (viewType === 'monthly' && date) {
      const [year, month] = date.split('-');
      query += ' AND strftime("%Y-%m", appointment_date) = ?';
      params.push(`${year}-${month}`);
    }

    query += ' ORDER BY appointment_date DESC, appointment_time DESC';

    const appointments = await dbAll(query, params);
    res.json(appointments);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching appointments',
      stack: error.stack,
      userId,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get single appointment
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const appointment = await dbGet(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching appointment',
      stack: error.stack,
      userId,
      appointmentId: id
    });
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create appointment
router.post('/api', requireLogin, async (req, res) => {
  const {
    appointmentDate,
    appointmentTime,
    customerName,
    phoneNumber,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    serviceRequired
  } = req.body;
  const userId = req.session.userId;

  try {
    if (!appointmentDate || !appointmentTime || !customerName || !serviceRequired) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT INTO appointments 
        (user_id, appointment_date, appointment_time, customer_name, phone_number, vehicle_year, vehicle_make, vehicle_model, service_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, appointmentDate, appointmentTime, customerName, phoneNumber, vehicleYear, vehicleMake, vehicleModel, serviceRequired]
    );

    logger.info('Appointment created', {
      userId,
      customerName,
      appointmentDate,
      appointmentId: result.lastID
    });

    res.status(201).json({ id: result.lastID, message: 'Appointment created' });
  } catch (error) {
    errorLogger.error({
      message: 'Error creating appointment',
      stack: error.stack,
      userId,
      method: 'POST',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const {
    appointmentDate,
    appointmentTime,
    customerName,
    phoneNumber,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    serviceRequired
  } = req.body;

  try {
    const appointment = await dbGet(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await dbRun(
      `UPDATE appointments 
       SET appointment_date = ?, appointment_time = ?, customer_name = ?, phone_number = ?, 
           vehicle_year = ?, vehicle_make = ?, vehicle_model = ?, service_required = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [appointmentDate, appointmentTime, customerName, phoneNumber, vehicleYear, vehicleMake, vehicleModel, serviceRequired, id, userId]
    );

    logger.info('Appointment updated', { userId, appointmentId: id, customerName });

    res.json({ message: 'Appointment updated' });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating appointment',
      stack: error.stack,
      userId,
      appointmentId: id
    });
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const appointment = await dbGet(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await dbRun('DELETE FROM appointments WHERE id = ? AND user_id = ?', [id, userId]);

    logger.info('Appointment deleted', { userId, appointmentId: id });

    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting appointment',
      stack: error.stack,
      userId,
      appointmentId: id
    });
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
