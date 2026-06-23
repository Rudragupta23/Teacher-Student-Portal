const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
    try {
        let { receiverId, content } = req.body; // Changed to 'let' so we can modify it
        
        // --- GLOBAL CHAT LOGIC ---
        if (receiverId === 'all') {
            let newMsg = await Message.create({ sender: req.user.id, content, isGlobal: true });
            newMsg = await newMsg.populate('sender', 'name registrationName'); 
            return res.status(201).json(newMsg);
        }

        // --- NEW: AUTO-ASSIGN ADMIN RECEIVER FOR STUDENTS ---
        if (req.user.role === 'student' && !receiverId) {
            const admin = await User.findOne({ role: 'admin' });
            receiverId = admin._id;
        }

        // --- REGULAR DIRECT MESSAGE LOGIC ---
        const newMsg = await Message.create({ sender: req.user.id, receiver: receiverId, content });
        res.status(201).json(newMsg);
    } catch (error) {
        res.status(500).json({ message: "Error sending message" });
    }
};

exports.getConversation = async (req, res) => {
    try {
        let otherUserId = req.params.otherUserId;

        // --- GLOBAL CHAT LOGIC ---
        if (otherUserId === 'all') {
            const globalMessages = await Message.find({ isGlobal: true })
                                                .populate('sender', 'name registrationName')
                                                .sort({ createdAt: 1 });
            return res.status(200).json(globalMessages);
        }

        // --- REGULAR DIRECT MESSAGE LOGIC ---
        if (req.user.role === 'student' && !otherUserId) {
            const admin = await User.findOne({ role: 'admin' });
            otherUserId = admin._id;
        }

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: otherUserId },
                { sender: otherUserId, receiver: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversation" });
    }
};