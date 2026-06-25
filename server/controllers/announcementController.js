const Announcement = require('../models/Announcement');
const User = require('../models/User'); // Add this import
const sendEmail = require('../utils/sendEmail'); // Add this import

exports.createAnnouncement = async (req, res) => {
    try {
        const { content, imageUrl, targetAudience } = req.body;
        const announcement = new Announcement({ content, imageUrl, targetAudience });
        await announcement.save();

        // --- NEW EMAIL NOTIFICATION LOGIC ---
        let targetEmails = [];
        
        if (targetAudience === 'all') {
            const students = await User.find({ role: 'student' });
            targetEmails = students.map(s => s.email).filter(email => email);
        } else {
            const student = await User.findById(targetAudience);
            if (student && student.email) targetEmails.push(student.email);
        }

        if (targetEmails.length > 0) {
            const emailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #4f46e5; padding: 25px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📣 New Class Announcement</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">An important update has just been posted to the portal by your teacher:</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1f2937;">${content}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your dashboard to view more details.</p>
                    </div>
                </div>
            </div>
            `;

            // Send to all targeted students via BCC to protect privacy
            sendEmail({
                email: targetEmails.join(','), 
                subject: `New Class Announcement`,
                html: emailContent
            });
        }
        // ------------------------------------

        res.status(201).json({ message: "Announcement posted!", announcement });
    } catch (error) {
        res.status(500).json({ message: "Error posting announcement" });
    }
};
exports.getAdminAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('readBy', 'name registrationName yearGroup').sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: "Error fetching announcements" });
    }
};

exports.getStudentAnnouncements = async (req, res) => {
    try {
        const studentId = req.user.id; 
        const announcements = await Announcement.find({
            $or: [{ targetAudience: 'all' }, { targetAudience: studentId }]
        }).sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: "Error fetching announcements" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement.readBy.includes(req.user.id)) {
            announcement.readBy.push(req.user.id);
            await announcement.save();
        }
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating status" });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Announcement deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting announcement" });
    }
};