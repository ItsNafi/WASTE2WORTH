const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/* ── Role → dashboard redirect map ───────────────────────── */
const REDIRECT = {
  Citizen:      '/dashboard/citizen',
  Volunteer:    '/dashboard/volunteer',
  BhangariShop: '/dashboard/bhangari',
  Creator:      '/dashboard/creator',
  Admin:        '/dashboard/admin'
};

const AuthController = {
  /* ── Register ──────────────────────────────────────────── */
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator', 'Admin'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user   = await UserModel.create({ name, email, password: hashed, role: role || 'Citizen' });

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.status(201).json({
        message:  'Registration successful',
        redirect: REDIRECT[user.role] || '/storefront'
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  },

  /* ── Login ─────────────────────────────────────────────── */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.json({
        message:  'Login successful',
        redirect: REDIRECT[user.role] || '/storefront'
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  },

  /* ── Logout ────────────────────────────────────────────── */
  logout(_req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully', redirect: '/login' });
  },

  /* ── Current user profile ──────────────────────────────── */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  /* ── Update Role ───────────────────────────────────────── */
  async updateRole(req, res) {
    try {
      const { role } = req.body;
      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
      }

      // Update role in DB
      await UserModel.updateRole(req.user.id, role);

      // Fetch updated user to reissue token
      const user = await UserModel.findById(req.user.id);
      
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.json({ message: `Successfully upgraded to ${role}!`, redirect: REDIRECT[user.role] });
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

module.exports = AuthController;
