const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: ['Document', 'Video Link', 'External Link'] },
    url: { type: String, required: true }, 
    targetAudience: { type: mongoose.Schema.Types.Mixed, default: 'all' }, 
    yearGroupFilter: { type: String, default: 'all' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);