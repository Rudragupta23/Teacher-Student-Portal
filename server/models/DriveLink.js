const mongoose = require('mongoose');

const driveLinkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    targetAudience: { type: String, default: 'all' },
    yearGroupFilter: { type: String, default: 'all' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DriveLink', driveLinkSchema);