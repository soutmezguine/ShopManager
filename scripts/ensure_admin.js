const { dbRun, dbGet } = require('../utils/db-helpers');
const { logger } = require('../utils/logger');

async function ensureAdminAndMigrations() {
  try {
    // Create migrations/audit table if missing
    await dbRun(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const row = await dbGet('SELECT COUNT(*) AS admin_count FROM users');
    const adminCount = row ? row.admin_count : 0;

    if (adminCount === 0) {
      const firstUser = await dbGet('SELECT id, username FROM users ORDER BY id ASC LIMIT 1');
      if (firstUser && firstUser.id) {
        await dbRun('UPDATE users SET is_admin = 1, can_access_admin = 1 WHERE id = ?', [firstUser.id]);
        const details = `Promoted user id ${firstUser.id} (${firstUser.username}) to admin during initialization`;
        try {
          await dbRun('INSERT INTO migrations (name, details) VALUES (?, ?)', ['promote_first_user_to_admin', details]);
        } catch (err) {
          logger.info('Failed to insert migration log for admin promotion', { error: err.message });
        }
        logger.info(`Promoted user id ${firstUser.id} to admin and logged migration`);
      } else {
        logger.info('No existing users to promote; first registration will be admin');
      }
    }
  } catch (error) {
    logger.info('Error running ensureAdminAndMigrations', { error: error.message });
  }
}

module.exports = { ensureAdminAndMigrations };
