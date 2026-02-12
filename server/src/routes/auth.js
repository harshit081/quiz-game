const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, adminSecret, teacherSecret } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (role === 'admin' && adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    if (role === 'teacher' && process.env.TEACHER_SECRET && teacherSecret !== process.env.TEACHER_SECRET) {
      return res.status(403).json({ message: 'Invalid teacher secret' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'student';
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
    });

    req.session.user = { id: user._id.toString(), role: user.role, name: user.name };

    return res.status(201).json({
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = { id: user._id.toString(), role: user.role, name: user.name };

    return res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.json(req.session.user);
});

module.exports = router;
