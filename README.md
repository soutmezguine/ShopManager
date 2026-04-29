# Shop Manager

A modular, multi-user web application for managing shop operations including appointments, parts ordering, and task management. Built with Node.js, Express, and SQLite.

## Features

- **Multi-User Support**: Secure authentication with password hashing
- **Appointment Book**: 
  - Default dashboard module when logging in
  - Daily, weekly, and monthly view options
  - Quick appointment creation with customer details, vehicle info, and service notes
  - Double-click to view, edit, or delete appointments
  
- **Parts Ordering Log**:
  - Track RO numbers, parts ordered, vendors, arrival dates, and costs
  - Searchable by RO, parts name, vendor, or check number
  - Automatic deletion of orders older than 6 months
  - Hide orders older than 2 months
  - Newest orders displayed at top
  
- **To-Do List**:
  - Persistent sidebar on right side of application
  - Add, complete, edit, and delete tasks
  - Quick task addition via text input
  - Double-click to edit existing tasks
  - Visual distinction for completed tasks

- **Error Logging**: 
  - Human-readable error logs in `logs/` directory
  - Database error tracking for debugging
  - User activity logging

- **Navigation Menu**: 
  - Top navigation bar with module switching
  - Quick logout access

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

### Steps

1. **Clone or extract the project**:
   ```bash
   cd ShopManager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Usage

### First Time Setup

1. You will be redirected to the login page
2. Click "Register here" to create a new account
3. Enter your full name, desired username, and password
4. Click "Register" to create your account
5. Log in with your credentials

### Appointment Book Module

1. **View Appointments**:
   - Select Daily, Weekly, or Monthly view using buttons at the top
   - Use the date picker to navigate to different dates
   - Appointments are displayed with customer name, date, time, and vehicle info

2. **Add Appointment**:
   - Click "+ Add Appointment" button
   - Fill in required fields: Date, Time, Customer Name, Service Required
   - Optional fields: Phone Number, Vehicle Year/Make/Model
   - Click "Save"

3. **Edit Appointment**:
   - Double-click on an appointment in the list
   - Modify the details in the modal
   - Click "Save" to update

4. **Delete Appointment**:
   - Double-click an appointment to open it
   - Click "Delete" button in the modal
   - Confirm deletion

### Parts Ordering Log Module

1. **View Orders**:
   - Click "Parts Log" in the navigation menu
   - Orders are displayed with newest first
   - Only orders from the last 2 months are shown

2. **Search Orders**:
   - Use the search bar to filter by RO, Parts name, Vendor, or Check number
   - Search updates in real-time

3. **Add Order**:
   - Click "+ Add Order" button
   - Fill in: Order Date, RO, Parts Ordered, Vendor
   - Optional: Arrival Date, Cost, Check Number
   - Click "Save"

4. **Edit Order**:
   - Double-click an order in the list
   - Modify the details
   - Click "Save"

5. **Delete Order**:
   - Double-click an order
   - Click "Delete" button
   - Confirm deletion

### To-Do List

1. **Add Task**:
   - Type task text in the input field on the right sidebar
   - Press Enter or click "Add" button
   - Task appears in the list below

2. **Complete Task**:
   - Click the checkbox next to a task to mark as complete
   - Completed tasks appear grayed out and struck through

3. **Edit Task**:
   - Double-click a task or click the ✎ icon
   - Edit the text in the prompt
   - Click OK to save

4. **Delete Task**:
   - Click the 🗑 icon next to a task
   - Confirm deletion

## Project Structure

```
ShopManager/
├── config/
│   └── database.js           # Database initialization and schema
├── data/
│   └── shopmanager.db        # SQLite database file
├── logs/
│   ├── app.log              # Application logs
│   └── errors.log           # Error logs
├── public/
│   ├── css/
│   │   ├── dashboard.css    # Main dashboard styles
│   │   ├── auth.css         # Authentication styles
│   │   └── error.css        # Error page styles
│   └── js/
│       ├── dashboard.js     # Dashboard logic
│       ├── appointments.js  # Appointments module
│       ├── parts.js         # Parts ordering module
│       ├── todo.js          # To-do list module
│       └── main.js          # Global utilities
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── appointments.js      # Appointments API routes
│   ├── parts.js             # Parts ordering API routes
│   └── todo.js              # To-do list API routes
├── utils/
│   ├── logger.js            # Logging utilities
│   └── db-helpers.js        # Database helper functions
├── views/
│   ├── dashboard.ejs        # Main dashboard template
│   ├── 404.ejs              # 404 error page
│   ├── error.ejs            # Error page
│   └── auth/
│       ├── login.ejs        # Login page
│       └── register.ejs     # Registration page
├── server.js                # Main application file
└── package.json             # Project dependencies
```

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password`: Hashed password
- `full_name`: User's full name
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp

### Appointments Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `appointment_date`: Date of appointment
- `appointment_time`: Time of appointment
- `customer_name`: Name of customer
- `phone_number`: Customer phone number
- `vehicle_year`: Vehicle year
- `vehicle_make`: Vehicle make
- `vehicle_model`: Vehicle model
- `service_required`: Description of service
- `created_at`, `updated_at`: Timestamps

### Parts Orders Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `order_date`: Date order was placed
- `ro`: Repair order number
- `parts_ordered`: Description of parts
- `vendor`: Vendor name
- `arrival_date`: Expected/actual arrival date
- `cost`: Order cost
- `check_number`: Check number for payment
- `created_at`, `updated_at`: Timestamps

### Todos Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `task_text`: Task description
- `completed`: Completion status (0 or 1)
- `created_at`, `updated_at`: Timestamps

### Error Logs Table
- `id`: Primary key
- `level`: Log level (ERROR, WARN, INFO)
- `message`: Error message
- `stack`: Stack trace
- `user_id`: Associated user
- `additional_info`: JSON additional information
- `logged_at`: Timestamp

## Error Logging

All application errors are logged in two ways:

1. **File Logs**: Located in the `logs/` directory
   - `app.log`: General application logs
   - `errors.log`: Error-specific logs
   - Human-readable format with timestamps

2. **Database Logs**: Stored in the `error_logs` table for long-term tracking

## Keyboard Shortcuts

- `Ctrl+N` (Cmd+N on Mac): Quick add for the current module
  - In Appointments: Opens new appointment modal
  - In Parts: Opens new parts order modal

## Security Notes

- Passwords are hashed using bcryptjs before storage
- Session management with secure cookies
- Each user's data is isolated to their user account
- All API routes check user authentication

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, set a different port:
```bash
PORT=3001 npm start
```

### Database Issues
If you encounter database errors, the database file is stored in `data/shopmanager.db`. You can delete it to reset the database (all data will be lost).

### Missing Dependencies
If you get module not found errors, reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

## Development

For development with hot-reload:

```bash
npm run dev
```

This requires nodemon to be installed (included in devDependencies).

## Contributing

To add new features or modules:

1. Create new API routes in the `routes/` directory
2. Add frontend templates in `views/`
3. Add styles in `public/css/`
4. Add functionality scripts in `public/js/`
5. Update the navigation menu in `views/dashboard.ejs`

## License

This project is provided as-is for shop management purposes.

## Support

For issues or questions:
1. Check the error logs in `logs/` directory
2. Review the browser console for JavaScript errors
3. Check the database connection in `config/database.js`
