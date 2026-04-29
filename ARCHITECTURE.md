# Architecture and Technical Details

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Frontend**: HTML/CSS/JavaScript with EJS templating
- **Authentication**: bcryptjs for password hashing
- **Session Management**: express-session

## Application Architecture

### Layered Architecture

```
┌─────────────────────────────────┐
│       Frontend (Browser)         │
│  HTML/CSS/JavaScript/EJS         │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Express Server              │
│  Routes/Middleware/Error Handler │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Data Access Layer               │
│  DB Helpers & Query Functions    │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      SQLite Database             │
│  Users, Appointments, Parts, etc │
└─────────────────────────────────┘
```

## Module Architecture

Each module follows this pattern:

1. **Frontend Component** (JavaScript)
   - Handles UI interactions
   - Makes API calls
   - Updates DOM

2. **API Routes** (Express Router)
   - Validates input
   - Checks authentication
   - Performs database operations

3. **Database Layer** (SQLite)
   - Stores module data
   - Maintains referential integrity
   - Logs operations

## File Organization

### Backend Files

- `server.js` - Application entry point
- `config/database.js` - Database initialization
- `routes/*.js` - API endpoints for each module
- `utils/logger.js` - Logging functionality
- `utils/db-helpers.js` - Database utilities

### Frontend Files

- `views/*.ejs` - HTML templates
- `public/css/*.css` - Stylesheets
- `public/js/*.js` - Client-side logic

## API Routes

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/logout` - User logout

### Appointments
- `GET /appointments/api/:viewType` - Fetch appointments
- `GET /appointments/api/:id` - Get single appointment
- `POST /appointments/api` - Create appointment
- `PUT /appointments/api/:id` - Update appointment
- `DELETE /appointments/api/:id` - Delete appointment

### Parts
- `GET /parts/api` - Fetch all parts orders (with search)
- `GET /parts/api/:id` - Get single order
- `POST /parts/api` - Create order
- `PUT /parts/api/:id` - Update order
- `DELETE /parts/api/:id` - Delete order

### To-Do
- `GET /todo/api` - Fetch all todos
- `GET /todo/api/:id` - Get single todo
- `POST /todo/api` - Create todo
- `PUT /todo/api/:id` - Update todo
- `PATCH /todo/api/:id/toggle` - Toggle completion
- `DELETE /todo/api/:id` - Delete todo

## Data Flow

### Creating an Appointment

```
User fills form
        ↓
Form submission event
        ↓
JavaScript collects data
        ↓
POST request to /appointments/api
        ↓
Express validates input
        ↓
Check user authentication
        ↓
Database insert operation
        ↓
Database returns success
        ↓
JavaScript receives response
        ↓
Update DOM with new appointment
        ↓
Show success notification
```

## Security Features

1. **Password Hashing**
   - All passwords hashed with bcryptjs
   - Original passwords never stored

2. **Session Management**
   - Secure session cookies
   - HTTPOnly flag prevents XSS
   - 24-hour session timeout

3. **Input Validation**
   - Server-side validation on all inputs
   - Type checking on all form data

4. **User Isolation**
   - All queries filtered by `user_id`
   - Users only see their own data

5. **Error Handling**
   - Errors logged securely
   - Stack traces not exposed to users

## Performance Considerations

1. **Database Indexing**
   - Primary keys on all tables
   - Foreign key relationships
   - Automatic cleanup of old parts orders

2. **Query Optimization**
   - Filtered queries by user
   - Date-based filtering for parts orders
   - Sorted results for better UX

3. **Frontend Optimization**
   - Minimal dependencies
   - Vanilla JavaScript
   - CSS Grid for responsive layout
   - Efficient event delegation

## Deployment Recommendations

### Production Checklist

- [ ] Change SESSION_SECRET in server.js
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Use a process manager (PM2)
- [ ] Set up database backups
- [ ] Configure logging rotation
- [ ] Use a reverse proxy (Nginx)
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Environment Configuration

Create a `.env` file for production:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-random-string
DB_PATH=/var/lib/shopmanager/shopmanager.db
LOG_LEVEL=warn
```

## Error Handling Strategy

1. **Client-Side**: Show user-friendly notifications
2. **Server-Side**: Log detailed errors for debugging
3. **Database**: Handle constraint violations gracefully
4. **Middleware**: Global error handler catches all errors

## Future Enhancement Ideas

1. **Reporting Module**
   - Revenue reports
   - Appointment statistics
   - Parts ordering analytics

2. **Email Notifications**
   - Appointment reminders
   - Low inventory alerts

3. **Mobile Responsive UI**
   - Touch-friendly interface
   - Mobile-optimized views

4. **Invoice Management**
   - Generate invoices
   - Payment tracking

5. **Customer Database**
   - Full customer profiles
   - Service history

6. **Backup & Recovery**
   - Automated database backups
   - Data export/import

## Testing Recommendations

### Unit Tests
- Database helper functions
- Validation functions
- Logger functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- User registration and login
- Creating/editing/deleting records
- Module navigation

## Maintenance Tasks

### Weekly
- Review error logs
- Check application performance
- Monitor disk space

### Monthly
- Database optimization
- Security update checks
- User activity review

### Quarterly
- Full backup verification
- Performance analysis
- Feature planning
