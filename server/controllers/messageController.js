const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a user
// @route   GET /api/messages/:id?
exports.getMessages = async (req, res) => {
  try {
    let query = {};
    const targetId = req.params.id; // Can be 'all', a specific user ID, or undefined
    
    // 1. IF ANYONE (Admin/Student/Parent) IS FETCHING THE GLOBAL CHAT
    if (targetId === 'all') {
      query = { isGlobal: true };
    } 
    // 2. IF ADMIN IS FETCHING A PRIVATE CHAT WITH A SPECIFIC STUDENT/PARENT
    else if (req.user.role === 'admin') {
      if (!targetId) return res.status(400).json({ message: "Target ID required to fetch private chat" });
      
      query = {
        $or: [
          { sender: targetId },
          { receiver: targetId }
        ],
        isGlobal: { $ne: true } // Keep global messages OUT of private chats
      };
    } 
    // 3. IF STUDENT OR PARENT IS FETCHING THEIR OWN PRIVATE MENTOR CHAT
    else {
      const myId = req.user._id;
      // Fetch ONLY private messages involving them
      query = {
        $or: [
          { sender: myId },
          { receiver: myId }
        ],
        isGlobal: { $ne: true } // <--- FIX: This stops global chat from showing in Mentor tab
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
    
    // 1. HANDLE GLOBAL CHAT (Anyone sending to 'all')
    if (receiverId === 'all') {
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