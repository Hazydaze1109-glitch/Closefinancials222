const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool - CONFIGURED FOR TIDB CLOUD
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 4000,
  ssl: {
    rejectUnauthorized: false // Set to false to avoid certificate issues during setup
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds timeout
});

// Helper function to get connection
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('Database Connection Error:', err);
    throw new Error('Failed to connect to database: ' + err.message);
  }
}

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ USER ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone, location } = req.body;

  if (!email || !password || !name || !phone || !location) {
    return res.status(400).json({ error: 'All fields required' });
  }

  let conn;
  try {
    conn = await getConnection();
    
    // Check if user exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await conn.query(
      'INSERT INTO users (email, password, name, phone, location, hasActiveApplication) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, phone, location, 0]
    );

    // Get user
    const [users] = await conn.query('SELECT id, email, name FROM users WHERE email = ?', [email]);
    const user = users[0];

    // Create token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  let conn;
  try {
    conn = await getConnection();
    const [users] = await conn.query('SELECT id, email, name, password, hasActiveApplication FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name, hasActiveApplication: user.hasActiveApplication === 1 } 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ============ LOAN ROUTES ============

// Submit business loan
app.post('/api/loans/business', authMiddleware, async (req, res) => {
  const { fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt } = req.body;

  let conn;
  try {
    conn = await getConnection();
    await conn.query(
      `INSERT INTO loan_applications (userId, loanType, fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'business', fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, 'Processing']
    );
    await conn.query('UPDATE users SET hasActiveApplication = 1 WHERE id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application: ' + err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
