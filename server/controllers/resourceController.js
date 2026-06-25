const Resource = require('../models/Resource');
const User = require('../models/User'); // Add this import
const sendEmail = require('../utils/sendEmail'); // Add this import

exports.createResource = async (req, res) => {
    try {
        const { title, description, type, url } = req.body;
        const resource = new Resource({ title, description, type, url });
        await resource.save();

        // --- NEW EMAIL NOTIFICATION LOGIC ---
        const students = await User.find({ role: 'student' });
        const studentEmails = students.map(student => student.email).filter(email => email);

        if (studentEmails.length > 0) {
            // Check if the uploaded resource is a link or website (this ignores PDFs)
            const isLinkType = type && (
                type.toLowerCase().includes('link') || 
                type.toLowerCase().includes('youtube') || 
                type.toLowerCase().includes('website')
            );

            // Fix the URL to prevent it from acting as a relative link to your own website
            let validUrl = url;
            if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                validUrl = 'https://' + validUrl;
            }

            // Create a clickable link box that explicitly shows the actual URL text
            const urlHtml = (url && isLinkType) 
                ? `<div style="margin-top: 15px; padding: 15px; background-color: #ffffff; border-radius: 6px; border: 1px solid #ddd6fe; word-break: break-all;">
                       <p style="margin: 0 0 5px 0; color: #5b21b6; font-size: 14px; font-weight: bold;">Material Link:</p>
                       <a href="${validUrl}" target="_blank" style="color: #6d28d9; text-decoration: underline; font-size: 14px;">${validUrl}</a>
                   </div>` 
                : '';

            const emailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #8b5cf6; padding: 25px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📚 New Study Material</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello Student,</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">New learning resources have been uploaded to help you with your studies.</p>
                        
                        <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; margin: 25px 0; border-radius: 8px;">
                            <h3 style="margin: 0 0 10px 0; color: #5b21b6; font-size: 18px;">${title}</h3>
                            <p style="margin: 0; color: #6d28d9; font-size: 15px;">${description || 'Resource document ready for download.'}</p>
                            ${urlHtml}
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Log in to your student dashboard to access and download the new materials.</p>
                    </div>
                </div>
            </div>
            `;

            sendEmail({
                email: studentEmails.join(','),
                subject: `New Study Material: ${title}`,
                html: emailContent
            });
        }
        // ------------------------------------

        res.status(201).json({ message: "Resource added successfully!", resource });
    } catch (error) {
        res.status(500).json({ message: "Error uploading resource" });
    }
};

exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: "Error fetching resources" });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Resource deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting resource" });
    }
};