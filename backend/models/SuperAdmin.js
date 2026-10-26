const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

// Export the model, ensuring it’s only compiled once
module.exports = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);