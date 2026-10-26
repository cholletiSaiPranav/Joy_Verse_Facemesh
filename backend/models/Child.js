const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  childName: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  userId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  isActive: { type: Boolean, default: true },
  emotionHistory: [{
    emotion: String,
    question: String,
    timestamp: { type: Date, default: Date.now },
  }],
  gameReports: [{
    score: Number,
    completedAt: { type: Date, default: Date.now },
    emotions: [String],
    question: String,
    isCorrect: Boolean,
  }],
});

// Export the model, ensuring it’s only compiled once
module.exports = mongoose.models.Child || mongoose.model('Child', childSchema);