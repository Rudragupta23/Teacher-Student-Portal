const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        let finalReceiverId = receiverId;

        if (req.user.role === 'student' && !receiverId) {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) return res.status(404).json({ message: "Admin not found" });
            finalReceiverId = admin._id;
        }

        const msg = new Message({ sender: req.user.id, receiver: finalReceiverId, content });
        await msg.save();
        res.status(201).json(msg);
    } catch (error) {
        res.status(500).json({ message: "Error sending message" });
    }
};

exports.getConversation = async (req, res) => {
    try {
        let otherUserId = req.params.otherUserId;

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