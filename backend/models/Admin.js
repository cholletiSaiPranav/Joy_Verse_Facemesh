const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  profilePhoto: String,
  password: { type: String, required: true },
  active: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
});

// Export the model, ensuring it’s only compiled once
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);