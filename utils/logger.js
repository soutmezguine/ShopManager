const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');
const errorFile = path.join(logsDir, 'errors.log');

function formatTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function formatLogMessage(level, message, data = {}) {
  const timestamp = formatTimestamp();
  const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '';
  
  return `
[${timestamp}] [${level}] ${message}
${dataStr}
${'='.repeat(80)}
`;
}

const logger = {
  info: (message, data = {}) => {
    const logMessage = formatLogMessage('INFO', message, data);
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage);
  },
  
  warn: (message, data = {}) => {
    const logMessage = formatLogMessage('WARN', message, data);
    console.warn(logMessage);
    fs.appendFileSync(logFile, logMessage);
  },
  
  debug: (message, data = {}) => {
    const logMessage = formatLogMessage('DEBUG', message, data);
    console.log(logMessage);
    if (process.env.NODE_ENV === 'development') {
      fs.appendFileSync(logFile, logMessage);
    }
  }
};

const errorLogger = {
  error: (errorData = {}) => {
    const {
      message = 'Unknown error',
      stack = '',
      method = 'N/A',
      url = 'N/A',
      userId = 'anonymous',
      status = 500,
      ...additional
    } = errorData;

    const timestamp = formatTimestamp();
    const errorMessage = `
[${timestamp}] [ERROR] ${message}
Status Code: ${status}
User ID: ${userId}
Method: ${method}
URL: ${url}
Stack Trace:
${stack}
Additional Info: ${JSON.stringify(additional, null, 2)}
${'='.repeat(80)}
`;

    console.error(errorMessage);
    fs.appendFileSync(errorFile, errorMessage);
  },

  logToDatabase: (db, errorData = {}) => {
    const {
      message = 'Unknown error',
      stack = '',
      userId = null,
      level = 'ERROR',
      ...additional
    } = errorData;

    const additionalStr = JSON.stringify(additional);
    const query = `
      INSERT INTO error_logs (level, message, stack, user_id, additional_info)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [level, message, stack, userId, additionalStr], (err) => {
      if (err) {
        console.error('Failed to log error to database:', err.message);
      }
    });
  }
};

module.exports = { logger, errorLogger };
