import 'dotenv/config';
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const requiredEnvVars = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL SECURITY ERROR: ${envVar} is missing from .env file.`);
    process.exit(1); 
  }
}
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; 
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No session token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Invalid session" });
  }
};

const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
};

// initalize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        patient_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables initialized");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initializeDatabase();

// AUTH ROUTES

// Helper function to set the HttpOnly cookie
const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict', 
    maxAge: 24 * 60 * 60 * 1000 
  });
};
// Sign up
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role",
      [escapeHTML(username), escapeHTML(email), hashedPassword, "user"]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    
    sendTokenCookie(res, token); 
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    
    sendTokenCookie(res, token); 
    res.json({ message: "Login successful", user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out successfully" });
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, role FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN ROUTES

// Get all users (admin only)
app.get('/api/admin/users', verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  try {
    const result = await pool.query("SELECT id, username, email, role, created_at FROM users");
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.patch('/api/admin/users/:id/role', verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  const { role } = req.body;
  const { id } = req.params;

  if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  try {
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role",
      [role, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User role updated", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// POST route to receive form data and save to PostgreSQL
app.post('/api/notes', verifyToken, async (req, res) => {
  const { patientName, doctorName, date, notes } = req.body;
  if (!patientName || !doctorName || !date || !notes) return res.status(400).json({ error: "All fields are required." });

  const safePatientName = escapeHTML(patientName);
  const safeDoctorName = escapeHTML(doctorName);
  const safeNotes = escapeHTML(notes);

  try {
    const result = await pool.query(
      "INSERT INTO medical_notes (user_id, patient_name, doctor_name, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, safePatientName, safeDoctorName, date, safeNotes]
    );
    console.log("New medical note saved to DB by user ID:", req.user.id);
    res.status(201).json({ message: "Note saved successfully.", note: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// GET route to view/search notes from PostgreSQL
app.get('/api/notes', verifyToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'admin') {
      query = "SELECT * FROM medical_notes ORDER BY created_at DESC";
    } else {
      query = "SELECT * FROM medical_notes WHERE user_id = $1 ORDER BY created_at DESC";
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    
    const formattedNotes = result.rows.map(row => ({
      id: row.id,
      patientName: row.patient_name,
      doctorName: row.doctor_name,
      date: row.date,
      notes: row.notes
    }));

    res.json(formattedNotes);
  } catch (err) {
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});