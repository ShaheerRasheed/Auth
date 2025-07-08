const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'InterSys@2024',
  database: 'blogging',
});

const JWT_KEY = '$%45^&67*(89';

// ✅ Global middleware: skip only /register
app.use((req, res, next) => {
  const openRoutes = ['/register']; // 🛑 Only /register is open

  if (openRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  console.log("Token received:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
});

// ✅ Register — open
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    res.json({ message: 'User registered' });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// 🔐 Login — token required (only accessible if already logged in)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid ' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_KEY,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// 🔒 Example protected route
app.get('/protected', (req, res) => {
  res.json({
    message: `Welcome ${req.user.username}! You are logged in as ${req.user.role}.`,
    user: req.user
  });
});

console.log('TEST');

app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
