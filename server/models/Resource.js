// server/models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: ['Document', 'Video Link', 'External Link'] },
    url: { type: String, required: true }, // Holds the Base64 file string OR the actual http link
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);