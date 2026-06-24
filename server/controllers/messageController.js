const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a user
// @route   GET /api/messages/:id?
exports.getMessages = async (req, res) => {
  try {
    let targetId;
    
    // If Admin, use the ID passed in the URL
    if (req.user.role === 'admin') {
      targetId = req.params.id; 
      if (!targetId) return res.status(400).json({ message: "Student or Parent ID required" });
    } else {
      // If Student OR Parent, use their own logged-in ID
      targetId = req.user._id;
    }

    const messages = await Message.find({
      $or: [
        { sender: targetId },
        { receiver: targetId }
      ]
    }).populate('sender', 'name role registrationName').sort('createdAt');

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
    let finalReceiverId = receiverId;

    // If Student or Parent is sending without specifying a receiver, route directly to Admin
    if (req.user.role !== 'admin' && !finalReceiverId) {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      finalReceiverId = admin._id;
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: finalReceiverId,
      content
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};