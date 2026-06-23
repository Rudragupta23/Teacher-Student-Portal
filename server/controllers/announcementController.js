const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res) => {
    try {
        const { content, imageUrl, targetAudience } = req.body;
        const announcement = new Announcement({ content, imageUrl, targetAudience });
        await announcement.save();
        res.status(201).json({ message: "Announcement posted!", announcement });
    } catch (error) {
        res.status(500).json({ message: "Error posting announcement" });
    }
};

exports.getAdminAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('readBy', 'name').sort({ createdAt: -1 });
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