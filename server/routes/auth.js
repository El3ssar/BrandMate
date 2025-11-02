import express from 'express';
import { userDb } from '../db/users.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    if (userDb.findByEmail(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (userDb.findByUsername(username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const user = userDb.create({ username, email, password, displayName });
    const token = generateToken(user);

    res.json({
      ok: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = userDb.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!userDb.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userInfo = userDb.findById(user.id);
    const token = generateToken(userInfo);

    res.json({
      ok: true,
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    ok: true,
    data: req.user
  });
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, email } = req.body;
    const updates = {};

    if (displayName) updates.displayName = displayName;
    if (email) updates.email = email;

    const updatedUser = userDb.update(req.user.id, updates);

    res.json({
      ok: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


