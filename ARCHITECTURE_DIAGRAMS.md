# System Architecture Diagram

## Overall System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Web Browsers                            │
│                  (Chrome, Firefox, Safari, Edge)                │
└────────────────────┬─────────────────────────────────────────────┘
                     │ HTTP/HTTPS Requests
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                    Express.js Server                            │
│                  (Node.js Application)                          │
├────────────────────────────────────────────────────────────────┤
│  Routes:                                                         │
│  ├─ /auth (Login, Register, Logout)                             │
│  ├─ /appointments (CRUD operations)                             │
│  ├─ /parts (CRUD operations)                                    │
│  └─ /todo (CRUD operations)                                     │
├────────────────────────────────────────────────────────────────┤
│  Middleware:                                                     │
│  ├─ Session Management                                          │
│  ├─ Body Parser                                                 │
│  ├─ Static File Serving                                         │
│  └─ Error Handler                                               │
└────────────────────┬─────────────────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                   SQLite Database                               │
│                 (shopmanager.db)                                │
├────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├─ users (authentication & tracking)                           │
│  ├─ appointments (service bookings)                             │
│  ├─ parts_orders (parts tracking)                               │
│  ├─ todos (task management)                                     │
│  └─ error_logs (debugging)                                      │
└────────────────────────────────────────────────────────────────┘

Additional Services:
├─ Logger → logs/app.log (application logs)
├─ ErrorLogger → logs/errors.log (error details)
└─ Sessions → In-memory (secure cookies)
```

## Request Flow Diagram

```
User Request
    ↓
[Browser - JavaScript]
    ↓
Fetch API Call to /api endpoint
    ↓
[Express Router]
    ↓
Route Handler
    ↓
Authentication Check (Session)
    ↓
Input Validation
    ↓
[Database Helper]
    ↓
SQL Query Construction
    ↓
[SQLite Database]
    ↓
Execute Query
    ↓
Return Result
    ↓
[Express Handler]
    ↓
Format Response (JSON)
    ↓
Send Response
    ↓
[Browser JavaScript]
    ↓
Parse JSON
    ↓
Update DOM
    ↓
Show Notification
    ↓
User sees result
```

## Module Architecture

```
┌──────────────────────────────────────────────────┐
│           Dashboard (Main Entry Point)            │
├──────────────────────────────────────────────────┤
│  Navigation Bar (Module Switching)                │
│  Main Content Area (Module Content)               │
│  Sidebar (Always visible - Todo List)             │
└──────────────────────────────────────────────────┘

┌─ APPOINTMENTS MODULE ─────────────────────────┐
│  Frontend:                Backend:             │
│  ├─ appointments.js  ├─ /appointments/api   │
│  ├─ HTML Template    ├─ appointments.js     │
│  └─ Modal Forms      └─ appointments table  │
└──────────────────────────────────────────────┘

┌─ PARTS ORDERING MODULE ───────────────────────┐
│  Frontend:                Backend:             │
│  ├─ parts.js         ├─ /parts/api          │
│  ├─ HTML Template    ├─ parts.js            │
│  ├─ Search Logic     └─ parts_orders table  │
│  └─ Modal Forms                              │
└──────────────────────────────────────────────┘

┌─ TODO LIST MODULE (PERSISTENT) ────────────────┐
│  Frontend:                Backend:             │
│  ├─ todo.js          ├─ /todo/api           │
│  ├─ HTML Template    ├─ todo.js             │
│  └─ Task Managers    └─ todos table         │
└──────────────────────────────────────────────┘

┌─ AUTHENTICATION MODULE ───────────────────────┐
│  Frontend:                Backend:             │
│  ├─ login.ejs        ├─ POST /auth/login   │
│  ├─ register.ejs     ├─ POST /auth/register │
│  ├─ auth.css         ├─ GET /auth/logout   │
│  └─ Validation       └─ users table        │
└──────────────────────────────────────────────┘
```

## Data Flow - Creating an Appointment

```
User Interface
    ↓ [User clicks "Add Appointment"]
Form Modal Opens
    ↓ [User fills in details]
Form Ready
    ↓ [User clicks "Save"]
JavaScript Handler
    ├─ Collect form data
    ├─ Validate input
    └─ Create fetch request
    ↓
POST /appointments/api
    ↓
[Express Handler]
    ├─ Check session (user logged in?)
    ├─ Validate input data
    ├─ Check required fields
    └─ Prepare database query
    ↓
[Database Helper]
    ├─ Build SQL INSERT
    └─ Execute query
    ↓
SQLite Database
    ├─ Insert row into appointments table
    ├─ Set timestamps
    └─ Return lastID
    ↓
[Express Handler]
    ├─ Check result success
    ├─ Log operation
    └─ Format response
    ↓
JSON Response
    ├─ {id: 123, message: 'Appointment created'}
    └─ HTTP 201 Created
    ↓
[JavaScript Handler]
    ├─ Parse response
    ├─ Show success notification
    ├─ Close modal
    └─ Reload appointments
    ↓
DOM Update
    ├─ Fetch appointments from API
    ├─ Render in list
    └─ Display to user
```

## Error Flow Diagram

```
Error Occurs (Any Layer)
    ↓
[Error Object Created]
    ├─ Message
    ├─ Stack trace
    ├─ User context
    └─ Additional info
    ↓
[Logger Utility]
    ├──→ logs/errors.log (file)
    └──→ error_logs table (database)
    ↓
[Express Error Handler]
    ├─ Format error response
    ├─ Hide sensitive info from user
    └─ Send to browser
    ↓
[Browser]
    ├─ Receive error response
    ├─ Show user-friendly message
    └─ Log to console (dev mode)
    ↓
User sees notification (not technical details)
```

## Database Schema Diagram

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ username (UNIQUE)   │
│ password (hashed)   │
│ full_name           │
│ created_at          │
│ last_login          │
└─────────────────────┘
        │ (1:N relationship)
        ├──────────────────┬──────────────────┬──────────────────┐
        ↓                  ↓                  ↓                  ↓

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  appointments    │ │  parts_orders    │ │     todos        │ │  error_logs      │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ id (PK)          │ │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
│ user_id (FK)     │ │ user_id (FK)     │ │ user_id (FK)     │ │ level            │
│ appt_date        │ │ order_date       │ │ task_text        │ │ message          │
│ appt_time        │ │ ro               │ │ completed        │ │ stack            │
│ customer_name    │ │ parts_ordered    │ │ created_at       │ │ user_id (FK)     │
│ phone_number     │ │ vendor           │ │ updated_at       │ │ additional_info  │
│ vehicle_year     │ │ arrival_date     │ │                  │ │ logged_at        │
│ vehicle_make     │ │ cost             │ │                  │ │                  │
│ vehicle_model    │ │ check_number     │ │                  │ │                  │
│ service_required │ │ created_at       │ │                  │ │                  │
│ created_at       │ │ updated_at       │ │                  │ │                  │
│ updated_at       │ │                  │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Authentication Flow

```
User Visits App
    ↓
[Check Session]
    ├─ Session exists? 
    │  └─ YES → Go to Dashboard
    └─ NO → Redirect to Login
    ↓
Login Page
    ├─ User enters username & password
    └─ Click Login
    ↓
POST /auth/login
    ├─ Query users table for username
    ├─ Compare hashed password
    ├─ Validate credentials
    └─ On success:
       ├─ Create session
       ├─ Set secure cookie
       ├─ Update last_login
       ├─ Log activity
       └─ Redirect to Dashboard
    ↓
Dashboard Loaded
    ├─ Initialize modules
    ├─ Load appointments
    ├─ Load todos
    └─ Ready to use
```

## File Organization Visualization

```
shop-manager/
│
├─ 📄 server.js (Main Entry)
├─ 📄 package.json (Dependencies)
├─ 📁 config/
│  └─ database.js (DB Setup)
│
├─ 📁 routes/ (API Endpoints)
│  ├─ auth.js
│  ├─ appointments.js
│  ├─ parts.js
│  └─ todo.js
│
├─ 📁 utils/ (Utilities)
│  ├─ logger.js
│  └─ db-helpers.js
│
├─ 📁 views/ (EJS Templates)
│  ├─ dashboard.ejs
│  ├─ layout.ejs
│  ├─ 404.ejs
│  ├─ error.ejs
│  └─ auth/
│     ├─ login.ejs
│     └─ register.ejs
│
├─ 📁 public/
│  ├─ css/
│  │  ├─ dashboard.css
│  │  ├─ auth.css
│  │  └─ error.css
│  │
│  └─ js/
│     ├─ dashboard.js
│     ├─ appointments.js
│     ├─ parts.js
│     ├─ todo.js
│     └─ main.js
│
├─ 📁 data/
│  └─ shopmanager.db (SQLite Database)
│
├─ 📁 logs/
│  ├─ app.log
│  └─ errors.log
│
└─ 📄 Documentation
   ├─ README.md
   ├─ QUICKSTART.md
   ├─ ARCHITECTURE.md
   ├─ DEPLOYMENT.md
   ├─ PROJECT_SUMMARY.md
   └─ COMPLETION_CHECKLIST.md
```

## Technology Stack Visualization

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                 │
│  ┌───────────────────────────────────────────┐  │
│  │ HTML5 / CSS3 / JavaScript (Vanilla)       │  │
│  │ EJS Templates / Browser DOM                │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬────────────────────────────────┘
                   │ HTTP/AJAX
┌──────────────────▼────────────────────────────────┐
│            Application Layer                      │
│  ┌───────────────────────────────────────────┐  │
│  │  Node.js / Express.js                     │  │
│  │  ├─ Routing                               │  │
│  │  ├─ Middleware                            │  │
│  │  ├─ Sessions                              │  │
│  │  └─ Error Handling                        │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Dependencies:                            │  │
│  │  ├─ bcryptjs (Password hashing)           │  │
│  │  ├─ express-session (Sessions)            │  │
│  │  └─ body-parser (Request parsing)         │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬────────────────────────────────┘
                   │ SQL
┌──────────────────▼────────────────────────────────┐
│             Data Layer                           │
│  ┌───────────────────────────────────────────┐  │
│  │  SQLite3 Database                         │  │
│  │  ├─ Users                                 │  │
│  │  ├─ Appointments                          │  │
│  │  ├─ Parts Orders                          │  │
│  │  ├─ Todos                                 │  │
│  │  └─ Error Logs                            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Scalability for future modules
- ✅ Easy maintenance and debugging
- ✅ Security through validation and authentication
- ✅ Reliable error tracking
- ✅ Multi-user data isolation
