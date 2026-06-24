const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a user
// @route   GET /api/messages/:id?
exports.getMessages = async (req, res) => {
  try {
    let query = {};
    
    // 1. IF ADMIN IS FETCHING
    if (req.user.role === 'admin') {
      const targetId = req.params.id; 
      if (!targetId) return res.status(400).json({ message: "Target ID required" });
      
      if (targetId === 'all') {
        // Fetch ONLY the global class chat
        query = { isGlobal: true };
      } else {
        // Fetch the private conversation with a specific student/parent
        query = {
          $or: [
            { sender: targetId },
            { receiver: targetId }
          ],
          isGlobal: { $ne: true } // Keep global messages out of private chats
        };
      }
    } 
    // 2. IF STUDENT OR PARENT IS FETCHING
    else {
      const targetId = req.user._id;
      // Fetch their private messages PLUS any global messages sent by admin
      query = {
        $or: [
          { sender: targetId },
          { receiver: targetId },
          { isGlobal: true } 
        ]
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name role registrationName')
      .sort('createdAt');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    
    // 1. HANDLE GLOBAL CHAT (Admin sending to 'all')
    if (receiverId === 'all' && req.user.role === 'admin') {
      const newMessage = await Message.create({
        sender: req.user._id,
        isGlobal: true,    // Flags this as a global message
        content
      });
      return res.status(201).json(newMessage);
    }

    // 2. HANDLE PRIVATE CHAT
    let finalReceiverId = receiverId;

    // If Student or Parent sends without an ID, safely route to the Admin
    if (req.user.role !== 'admin' && !finalReceiverId) {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      finalReceiverId = admin._id;
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: finalReceiverId,
      isGlobal: false,
      content
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};