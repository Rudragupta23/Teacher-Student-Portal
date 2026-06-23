const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isGlobal: { type: Boolean, default: false }, 
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }    
});

module.exports = mongoose.model('Message', messageSchema);