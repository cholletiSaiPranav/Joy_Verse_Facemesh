// superadmin.js: Express router for superadmin-related routes, handling authentication, admin management, and file uploads

// Import required modules
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');

// Multer configuration for handling profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Initialize default SuperAdmin account if it doesn't exist
const initSuperAdmin = async () => {
  const existing = await SuperAdmin.findOne({ email: 'superadmin@joyverse.com' });
  if (!existing) {
    const hashed = await bcrypt.hash('superadmin123', 10);
    await SuperAdmin.create({ email: 'superadmin@joyverse.com', password: hashed });
    console.log('✅ Default SuperAdmin created');
  }
};
initSuperAdmin();

// Middleware to authenticate SuperAdmin
const authenticateSuperAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const superadmin = await SuperAdmin.findOne({ email: decoded.email });
    if (!superadmin) return res.status(401).json({ message: 'Unauthorized' });
    req.superadmin = superadmin;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Route: Verify superadmin token
router.get('/verify-token', authenticateSuperAdmin, async (req, res) => {
  try {
    res.json({ message: 'Token is valid', email: req.superadmin.email });
  } catch (err) {
    console.error('❌ Error verifying token:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: SuperAdmin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const superadmin = await SuperAdmin.findOne({ email });
    if (!superadmin) return res.status(401).json({ message: 'Invalid email' });

    const isMatch = await bcrypt.compare(password, superadmin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('❌ SuperAdmin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Register a new admin
router.post('/register-admin', authenticateSuperAdmin, upload.single('profilePhoto'), async (req, res) => {
  const { name, phone, email, password } = req.body;
  const profilePhoto = req.file ? req.file.path : null;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await Admin.findOne({ $or: [{ phone }, { email }] });
    if (existing) return res.status(400).json({ message: 'Phone or email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      name,
      phone,
      email,
      profilePhoto,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.json({ message: '✅ Admin registered successfully', admin: { name, phone, email } });
  } catch (err) {
    console.error('❌ Register Admin Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Get all admins
router.get('/admins', authenticateSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 });
    res.json(admins);
  } catch (err) {
    console.error('❌ Error fetching admins:', err);
    res.status(500).json({ message: 'Server error fetching admins' });
  }
});

// Route: Enable or disable an admin
router.put('/toggle-admin', authenticateSuperAdmin, async (req, res) => {
  const { phone, active } = req.body;
  if (!phone || active === undefined) {
    return res.status(400).json({ message: 'Phone and active status required' });
  }

  try {
    const admin = await Admin.findOneAndUpdate(
      { phone },
      { active },
      { new: true }
    ).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json({
      message: `Admin ${admin.active ? 'enabled' : 'disabled'} successfully`,
      admin,
    });
  } catch (err) {
    console.error('❌ Error updating admin status:', err);
    res.status(500).json({ message: 'Server error updating admin status' });
  }
});

// Route: Delete an admin
router.delete('/delete-admin/:phone', authenticateSuperAdmin, async (req, res) => {
  const { phone } = req.params;
  try {
    const deletedAdmin = await Admin.findOneAndDelete({ phone });
    if (!deletedAdmin) return res.status(404).json({ message: 'Admin not found' });

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting admin:', err);
    res.status(500).json({ message: 'Server error deleting admin' });
  }
});

module.exports = router;