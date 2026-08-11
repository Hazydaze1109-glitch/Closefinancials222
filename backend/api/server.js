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

// Database connection pool - UPDATED FOR TIDB CLOUD SSL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to get connection
async function getConnection() {
  return pool.getConnection();
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

  try {
    const conn = await getConnection();
    
    // Check if user exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      conn.release();
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

    conn.release();
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const conn = await getConnection();
    const [users] = await conn.query('SELECT id, email, name, password, hasActiveApplication FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    conn.release();
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name, hasActiveApplication: user.hasActiveApplication === 1 } 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// ============ LOAN ROUTES ============

// Submit business loan
app.post('/api/loans/business', authMiddleware, async (req, res) => {
  const { fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt } = req.body;

  try {
    const conn = await getConnection();
    
    await conn.query(
      `INSERT INTO loan_applications (userId, loanType, fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'business', fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, 'Processing']
    );

    // Update user's hasActiveApplication flag
    await conn.query('UPDATE users SET hasActiveApplication = 1 WHERE id = ?', [req.user.id]);

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Submit personal loan
app.post('/api/loans/personal', authMiddleware, async (req, res) => {
  const { fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory } = req.body;

  try {
    const conn = await getConnection();
    
    await conn.query(
      `INSERT INTO loan_applications (userId, loanType, fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'personal', fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory, 'Processing']
    );

    // Update user's hasActiveApplication flag
    await conn.query('UPDATE users SET hasActiveApplication = 1 WHERE id = ?', [req.user.id]);

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get user's loan application
app.get('/api/loans/my-application', authMiddleware, async (req, res) => {
  try {
    const conn = await getConnection();
    const [applications] = await conn.query('SELECT * FROM loan_applications WHERE userId = ? LIMIT 1', [req.user.id]);
    conn.release();
    res.json(applications[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// ============ ADMIN ROUTES ============

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const conn = await getConnection();
    const [admins] = await conn.query('SELECT id, email, name, password FROM admin_users WHERE email = ?', [email]);

    if (admins.length === 0) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, isAdmin: true }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    conn.release();
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all applications
app.get('/api/admin/applications', authMiddleware, async (req, res) => {
  try {
    const conn = await getConnection();
    const [applications] = await conn.query('SELECT * FROM loan_applications ORDER BY createdAt DESC');
    conn.release();
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
app.put('/api/admin/applications/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['Processing', 'Accepted', 'Final Steps', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const conn = await getConnection();
    await conn.query('UPDATE loan_applications SET status = ? WHERE id = ?', [status, id]);
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
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

    conn.release();
    res.json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const conn = await getConnection();
    const [users] = await conn.query('SELECT id, email, name, password, hasActiveApplication FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    conn.release();
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name, hasActiveApplication: user.hasActiveApplication === 1 } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ LOAN ROUTES ============

// Submit business loan
app.post('/api/loans/business', authMiddleware, async (req, res) => {
  const { fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt } = req.body;

  try {
    const conn = await getConnection();
    
    await conn.query(
      `INSERT INTO loan_applications (userId, loanType, fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'business', fullName, phone, email, businessName, businessAddress, cityState, country, timeInBusiness, industry, loanPurpose, loanAmount, loanTerm, annualRevenue, existingDebt, 'Processing']
    );

    // Update user's hasActiveApplication flag
    await conn.query('UPDATE users SET hasActiveApplication = 1 WHERE id = ?', [req.user.id]);

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Submit personal loan
app.post('/api/loans/personal', authMiddleware, async (req, res) => {
  const { fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory } = req.body;

  try {
    const conn = await getConnection();
    
    await conn.query(
      `INSERT INTO loan_applications (userId, loanType, fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'personal', fullName, phone, email, loanAmountPersonal, loanPurposePersonal, loanTermPersonal, addressHistory, employmentHistory, 'Processing']
    );

    // Update user's hasActiveApplication flag
    await conn.query('UPDATE users SET hasActiveApplication = 1 WHERE id = ?', [req.user.id]);

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get user's loan application
app.get('/api/loans/my-application', authMiddleware, async (req, res) => {
  try {
    const conn = await getConnection();
    const [applications] = await conn.query('SELECT * FROM loan_applications WHERE userId = ? LIMIT 1', [req.user.id]);
    conn.release();
    res.json(applications[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// ============ ADMIN ROUTES ============

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const conn = await getConnection();
    const [admins] = await conn.query('SELECT id, email, name, password FROM admin_users WHERE email = ?', [email]);

    if (admins.length === 0) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, isAdmin: true }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    conn.release();
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all applications
app.get('/api/admin/applications', authMiddleware, async (req, res) => {
  try {
    const conn = await getConnection();
    const [applications] = await conn.query('SELECT * FROM loan_applications ORDER BY createdAt DESC');
    conn.release();
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
app.put('/api/admin/applications/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['Processing', 'Accepted', 'Final Steps', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const conn = await getConnection();
    await conn.query('UPDATE loan_applications SET status = ? WHERE id = ?', [status, id]);
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
