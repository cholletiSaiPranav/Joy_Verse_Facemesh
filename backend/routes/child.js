// child.js: Express router for child-related routes, handling authentication, emotion detection, and game reports

// Import required modules
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Child = require('../models/Child');

// Middleware to verify JWT token for authenticated child routes
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Route: Verify child token
router.get('/verify-token', verifyToken, async (req, res) => {
  try {
    const child = await Child.findOne({ userId: req.user.userId });
    if (!child || !child.isActive) {
      return res.status(401).json({ message: 'Invalid or disabled account' });
    }
    res.json({ message: 'Token is valid', userId: req.user.userId });
  } catch (err) {
    console.error('❌ Error verifying token:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Child login
router.post('/login', async (req, res) => {
  const { childName, userId, password } = req.body;
  if (!childName || !userId || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const child = await Child.findOne({
      childName: { $regex: new RegExp(`^${childName}$`, 'i') },
      userId,
    });
    if (!child || !child.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or account disabled' });
    }

    const isMatch = await bcrypt.compare(password, child.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { userId: child.userId, childName: child.childName },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Login successful', token, userId: child.userId });
  } catch (err) {
    console.error('❌ Child login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Forward emotion detection request to Flask service
router.post('/detect-emotion', verifyToken, async (req, res) => {
  const { landmarks } = req.body;
  if (!landmarks) {
    return res.status(400).json({ message: 'Landmarks are required' });
  }

  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:5000/detect_emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks }),
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      console.error('❌ Flask response error:', data);
      res.status(response.status).json(data);
    }
  } catch (err) {
    console.error('❌ Error forwarding to Flask:', err);
    res.status(500).json({ message: 'Error communicating with emotion detection service' });
  }
});

// Route: Save emotion data for a child
router.post('/save-emotion', verifyToken, async (req, res) => {
  const { userId, emotion, question } = req.body;
  if (!userId || !emotion || !question) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const child = await Child.findOne({ userId });
    if (!child || !child.isActive) {
      return res.status(404).json({ message: 'Child not found or disabled' });
    }

    child.emotionHistory.push({ emotion, question, timestamp: new Date() });
    await child.save();

    req.app.get('io').emit('emotionUpdate', {
      parentId: child.parentId,
      userId,
      emotion,
      question,
      timestamp: new Date(),
    });
    res.json({ message: 'Emotion saved successfully' });
  } catch (err) {
    console.error('❌ Error saving emotion:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Get emotion trends for a child
router.get('/emotion-trends/:userId', verifyToken, async (req, res) => {
  try {
    const child = await Child.findOne({ userId: req.params.userId });
    if (!child) return res.status(404).json({ message: 'Child not found' });
    res.json(child.emotionHistory);
  } catch (err) {
    console.error('❌ Error fetching emotion trends:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Save game report for a child
router.post('/save-game', verifyToken, async (req, res) => {
  const { userId, score, emotions, question, isCorrect } = req.body;
  if (!userId || score === undefined || !question || isCorrect === undefined) {
    return res.status(400).json({ message: 'userId, score, question, and isCorrect are required' });
  }

  try {
    const child = await Child.findOne({ userId });
    if (!child || !child.isActive) {
      return res.status(404).json({ message: 'Child not found or disabled' });
    }

    child.gameReports.push({ score, emotions, question, isCorrect, completedAt: new Date() });
    await child.save();

    req.app.get('io').emit('gameReportUpdate', {
      parentId: child.parentId,
      userId,
      score,
      emotions,
      question,
      isCorrect,
      completedAt: new Date(),
    });
    res.json({ message: 'Game report saved successfully' });
  } catch (err) {
    console.error('❌ Error saving game report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Get game reports for a child
router.get('/game-reports/:userId', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const child = await Child.findOne({ userId: req.params.userId });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const gameReports = child.gameReports
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, limit);

    res.json(gameReports);
  } catch (err) {
    console.error('❌ Error fetching game reports:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;