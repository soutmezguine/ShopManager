# Quick Start Guide

## Prerequisites

Before starting, make sure you have:
- **Node.js** (v14 or higher) - Download from https://nodejs.org/
- **npm** (comes with Node.js)
- A web browser (Chrome, Firefox, Safari, or Edge)

## Installation Steps

### Windows Users

1. **Install Node.js**:
   - Go to https://nodejs.org/
   - Download the LTS (Long Term Support) version
   - Run the installer and follow the prompts
   - Restart your computer

2. **Run Setup Script**:
   - Open Command Prompt
   - Navigate to the ShopManager folder
   - Run: `setup.bat`
   - Wait for installation to complete

### Mac/Linux Users

1. **Install Node.js**:
   - Using Homebrew (Mac): `brew install node`
   - Or visit https://nodejs.org/

2. **Run Setup Script**:
   - Open Terminal
   - Navigate to the ShopManager folder
   - Run: `chmod +x setup.sh && ./setup.sh`
   - Wait for installation to complete

## Starting the Application

```bash
npm start
```

The application will start and show:
```
Shop Manager server running on http://localhost:3000
```

## First Login

1. Open your browser and go to: **http://localhost:3000**
2. Click "Register here"
3. Fill in:
   - Full Name: Your name
   - Username: Your desired username
   - Password: Your password (at least 4 characters)
   - Confirm Password: Repeat your password
4. Click "Register"
5. Log in with your credentials

## Using Shop Manager

### Appointments
- **View**: Select Daily/Weekly/Monthly view
- **Add**: Click "+ Add Appointment" button
- **Edit**: Double-click an appointment
- **Delete**: Open appointment and click "Delete"

### Parts Ordering
- **View**: Click "Parts Log" in menu
- **Search**: Use search bar to filter
- **Add**: Click "+ Add Order" button
- **Edit**: Double-click an order
- **Delete**: Open order and click "Delete"

### To-Do List
- On the right sidebar
- Type task and press Enter or click "Add"
- Check box to complete
- Double-click to edit
- Click trash icon to delete

## Troubleshooting

### "npm: The term 'npm' is not recognized"
- Node.js not installed correctly
- Restart your computer after installation
- Add Node.js to PATH manually if needed

### "Port 3000 already in use"
```bash
PORT=3001 npm start
```

### Database errors
- Delete `data/shopmanager.db` to reset
- Warning: This will delete all data!

### Application won't start
- Check console for errors
- Make sure port 3000 is not in use
- Try: `npm install` again

## Development Mode

For development with automatic reload:

```bash
npm run dev
```

This requires nodemon (should be installed automatically).

## Getting Help

Check the error logs:
- `logs/app.log` - General application logs
- `logs/errors.log` - Error details

## Next Steps

1. Create test appointments
2. Add sample parts orders
3. Create your task list
4. Explore module switching in the navigation menu
5. Try the search functionality in Parts Log

Enjoy using Shop Manager!
