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

// Get all todos for user
router.get('/api', requireLogin, async (req, res) => {
  const userId = req.session.userId;

  try {
    const todos = await dbAll(
      `SELECT t.*, u.full_name as created_by_name, u.username as created_by_username
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.completed ASC, t.created_at DESC`
    );
    res.json(todos);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching todos',
      stack: error.stack,
      userId,
      method: 'GET',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get single todo
router.get('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const todo = await dbGet(
      `SELECT t.*, u.full_name as created_by_name, u.username as created_by_username
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    errorLogger.error({
      message: 'Error fetching todo',
      stack: error.stack,
      userId,
      todoId: id
    });
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create todo
router.post('/api', requireLogin, async (req, res) => {
  const { taskText } = req.body;
  const userId = req.session.userId;

  try {
    if (!taskText || taskText.trim() === '') {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const result = await dbRun(
      'INSERT INTO todos (user_id, task_text, completed) VALUES (?, ?, 0)',
      [userId, taskText.trim()]
    );

    logger.info('Todo created', { userId, todoId: result.lastID });

    res.status(201).json({ id: result.lastID, taskText, completed: 0 });
  } catch (error) {
    errorLogger.error({
      message: 'Error creating todo',
      stack: error.stack,
      userId,
      method: 'POST',
      url: req.url
    });
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
router.put('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const { taskText, completed } = req.body;

  try {
    const todo = await dbGet(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updateTaskText = taskText !== undefined ? taskText : todo.task_text;
    const updateCompleted = completed !== undefined ? completed : todo.completed;

    await dbRun(
      'UPDATE todos SET task_text = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updateTaskText, updateCompleted ? 1 : 0, id]
    );

    logger.info('Todo updated', { userId, todoId: id });

    res.json({ message: 'Todo updated', id, taskText: updateTaskText, completed: updateCompleted });
  } catch (error) {
    errorLogger.error({
      message: 'Error updating todo',
      stack: error.stack,
      userId,
      todoId: id
    });
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Toggle todo completion
router.patch('/api/:id/toggle', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const todo = await dbGet(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const newCompleted = todo.completed ? 0 : 1;

    await dbRun(
      'UPDATE todos SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newCompleted, id]
    );

    logger.info('Todo toggled', { userId, todoId: id, completed: newCompleted });

    res.json({ message: 'Todo toggled', id, completed: newCompleted });
  } catch (error) {
    errorLogger.error({
      message: 'Error toggling todo',
      stack: error.stack,
      userId,
      todoId: id
    });
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

// Delete todo
router.delete('/api/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const todo = await dbGet(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await dbRun('DELETE FROM todos WHERE id = ?', [id]);

    logger.info('Todo deleted', { userId, todoId: id });

    res.json({ message: 'Todo deleted' });
  } catch (error) {
    errorLogger.error({
      message: 'Error deleting todo',
      stack: error.stack,
      userId,
      todoId: id
    });
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
