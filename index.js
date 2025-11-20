const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
// Middleware: verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}
const bcrypt = require('bcryptjs');



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Booking server running' });
});


// Helper: validate booking data
function validateBooking(data) {
  const { name, phone, pickupLocation, dropoffLocation, bags } = data;
  if (!name || typeof name !== 'string' || name.length < 2) return 'Invalid name';
  if (!phone || typeof phone !== 'string' || phone.length < 8) return 'Invalid phone';
  if (!pickupLocation || typeof pickupLocation !== 'string') return 'Invalid pickupLocation';
  if (!dropoffLocation || typeof dropoffLocation !== 'string') return 'Invalid dropoffLocation';
  if (!bags || typeof bags !== 'number' || bags < 1) return 'Invalid bags';
  return null;
}

// POST /login: user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('req.body', req.body)
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    console.log(password, user.password)
    const match = await bcrypt.compare(password, user.password);
    console.log(match)
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// POST /booking: create new booking (protected)
app.post('/booking', authenticateToken, async (req, res) => {
  const error = validateBooking(req.body);
  console.log('Received booking data:', req.body, error);
  if (error) return res.status(400).json({ error });
  const { name, phone, pickupLocation, dropoffLocation, bags } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO bookings (name, phone, pickup_location, dropoff_location, bags) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [name, phone, pickupLocation, dropoffLocation, bags]
    );
    console.log('Inserted booking:', result.rows[0]);
    res.status(201).json({ bookingID: result.rows[0].id, timestamp: result.rows[0].created_at });
  } catch (err) {
    console.log('Error inserting booking:', err);
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// PATCH /booking/:id/status: update booking status (protected)
app.patch('/booking/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['pending', 'picked_up'];
  if (!status || typeof status !== 'string' || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// GET /bookings: list all bookings (protected)
app.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
});

// Helper: create initial driver account if not exists
async function initDriver() {
  const username = 'driver';
  const password = 'driver123';
  const name = 'Driver';
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (username, password, name) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING`,
    [username, hash, name]
  );
}

initDriver();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
