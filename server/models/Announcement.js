const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    content: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    targetAudience: { type: String, default: 'all' }, // 'all' or specific studentId
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Tracks who read it
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);