const Message = require('../models/Message');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail'); // Add this import at the top

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

    // --- NEW EMAIL NOTIFICATION LOGIC ---
    const receiver = await User.findById(finalReceiverId);
    const sender = await User.findById(req.user._id);

    if (receiver && receiver.email) {
      const emailContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #0ea5e9; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">💬 New Message Received</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${receiver.registrationName || receiver.name},</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">You have a new direct message from <strong>${sender.registrationName || sender.name} (${sender.role})</strong>.</p>
                    
                    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 25px 0; border-radius: 8px; font-style: italic; color: #0369a1;">
                        "${content}"
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to the portal to reply.</p>
                </div>
            </div>
        </div>
      `;

      sendEmail({
        email: receiver.email,
        subject: 'New Message Notification',
        html: emailContent // using 'html' as defined in your sendEmail.js
      });
    }
    // ------------------------------------

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};