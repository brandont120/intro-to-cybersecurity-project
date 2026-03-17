# Authentication Setup Guide

This guide explains how to set up and use the authentication and authorization system with role-based access control (RBAC).

 Overview

The system supports two user roles:
- **Standard User**: Can view and submit medical notes
- **Admin**: Can manage users and assign roles

 Backend Setup

 1. Install Dependencies
```bash
cd backend
npm install
```

 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cybersecurity_project
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

 3. Database Setup
Make sure you have PostgreSQL installed and running. The backend will automatically create tables on startup.

 4. Start the Backend Server
```bash
npm run dev
# or
node server.js
```

The server will run on `http://localhost:5000`

 Frontend Setup

 1. Install Dependencies

```bash
cd ..
npm install
```

 2. Start the Development Server
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or similar)

 Authentication Flow

 Sign Up
1. Navigate to `/signup`
2. Enter username, email, and password
3. Confirm password
4. Click "Sign Up"
5. You will be automatically logged in and redirected to the dashboard

 Login
1. Navigate to `/login`
2. Enter your email and password
3. Click "Login"
4. You will be redirected to the dashboard

 Dashboard
- **Standard Users** see the medical notes form where they can:
  - Submit medical notes
  - See their username in the navbar
  - Logout

- **Admins** see the admin panel where they can:
  - View all users
  - Change user roles (promote to admin or demote from admin)
  - See user details (ID, username, email, current role)
  - Logout

 API Endpoints

 Authentication Routes (Public)
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Login with email and password

 Protected Routes (Require JWT Token)
- `GET /api/auth/me` - Get current user information
- `GET /api/notes` - Get all medical notes
- `POST /api/notes` - Submit a medical note

 Admin Routes (Require Admin Role)
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/role` - Update a user's role

 Security Features

1. **Password Hashing**: Passwords are hashed using bcryptjs with salt
2. **JWT Tokens**: Authentication uses JSON Web Tokens with 24-hour expiration
3. **Role-Based Access Control**: Endpoints are protected based on user role
4. **Protected Routes**: Frontend routes are protected and redirect unauthenticated users to login
5. **Token Storage**: Tokens are stored in localStorage for persistent sessions

 Project Structure

```
src/
├── App.jsx                 # Main app with routing setup
├── AuthContext.jsx         # Authentication context and hooks
├── Login.jsx              # Login page
├── Signup.jsx             # Sign up page
├── Dashboard.jsx          # Smart dashboard that routes based on role
├── StandardUserView.jsx   # Medical notes form for standard users
├── AdminPanel.jsx         # Admin user management interface
├── ProtectedRoute.jsx     # Route protection component
└── App.css                # Application styles
```

 Testing the System

 Create Test Users
1. Sign up as a standard user:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`

2. Sign up as an admin (you'll need to promote them):
   - Username: `testadmin`
   - Email: `admin@example.com`
   - Password: `adminpass123`

 Test Admin Features
1. Login with the first user account
2. In a different browser or private window, login with the second user account
3. Using the admin account, navigate to the admin panel
4. Promote the first user to admin role
5. Logout and login with the first user to see admin panel

 Test Protected Routes
1. Try accessing `/dashboard` without logging in - you'll be redirected to login
2. Login and access `/dashboard` - you'll see your appropriate view
3. Manual token removal: Open browser DevTools > Application > localStorage, remove `token` entry
4. Refresh page - you'll be redirected to login

