import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cybersecurity_project",
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
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

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role",
      [username, email, hashedPassword, "user"]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({ message: "User created successfully", user, token });
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Server error: " + err.message });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ADMIN ROUTES

// Get all users (admin only)
app.get('/api/admin/users', verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Update user role (admin only)
app.patch('/api/admin/users/:id/role', verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { role } = req.body;
  const { id } = req.params;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User role updated", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// store notes in memory for now
const medicalNotes = []

// POST route to receive form data from the frontend
app.post('/api/notes', verifyToken, (req, res) => {
  const { patientName, doctorName, date, notes } = req.body;

  // basic validation
  if (!patientName || !doctorName || !date || !notes) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // save the note
  const newNote = { patientName, doctorName, date, notes };
  medicalNotes.push(newNote);

  console.log("New medical note saved:", newNote);
  res.status(201).json({message: "Note saved successfully.", note: newNote });
});

// GET route to view all saved notes
app.get('/api/notes', verifyToken, (req, res) => {
  res.json(medicalNotes);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
