const DriveLink = require('../models/DriveLink');
const User = require('../models/User'); 
const sendEmail = require('../utils/sendEmail'); 

exports.createDriveLink = async (req, res) => {
    try {
        const { title, url, targetAudience, yearGroupFilter } = req.body;
        const newLink = new DriveLink({ title, url, targetAudience, yearGroupFilter });
        await newLink.save();
        let targetStudents = [];

        if (targetAudience === 'all') {
            let query = { role: 'student' };
            if (yearGroupFilter !== 'all') {
                query.yearGroup = yearGroupFilter;
            }
            targetStudents = await User.find(query);
        } else {
            const student = await User.findById(targetAudience);
            if (student) targetStudents.push(student);
        }

        const studentEmails = targetStudents.map(s => s.email).filter(email => email);

        const studentIds = targetStudents.map(s => s._id.toString());
        const studentRegistrationIds = targetStudents.map(s => s.studentId); // ID string

        const parents = await User.find({
            role: 'parent',
            $or: [
                { linkedStudentId: { $in: studentIds } },
                { linkedStudentId: { $in: studentRegistrationIds } }
            ]
        });
        const parentEmails = parents.map(p => p.email).filter(email => email);

        const allEmails = [...new Set([...studentEmails, ...parentEmails])];

        if (allEmails.length > 0) {
            const emailContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; line-height: 1.5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
                        
                        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px; text-align: center;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">☁️ Shared Drive Folder Available</h2>
                        </div>
                        
                        <div style="padding: 40px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #1e293b; font-weight: 700;">Hello there,</h3>
                            <p style="margin: 0 0 28px 0; font-size: 16px; color: #475569;">Your mentor has shared a new Google Drive folder with you on the MathCom Mentors portal. You can find the details below:</p>
                            
                            <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding-bottom: 12px; font-size: 15px; color: #64748b; width: 90px;"><strong>Folder Title:</strong></td>
                                        <td style="padding-bottom: 12px; font-size: 16px; color: #0f172a; font-weight: 700;">${title}</td>
                                    </tr>
                                </table>
                                
                                <div style="text-align: center; margin-top: 20px;">
                                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 30px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3); transition: background-color 0.2s;">🔗 Open Google Drive Folder</a>
                                </div>
                            </div>
                            
                            <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">You can also access this folder directly from the <strong style="color: #64748b;">Shared Drive</strong> tab inside your dashboard at any time.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">&copy; ${new Date().getFullYear()} MathCom Mentors. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `;

            sendEmail({
                email: allEmails.join(','),
                subject: `New Shared Drive Link: ${title}`,
                html: emailContent
            });
        }

        res.status(201).json(newLink);
    } catch (error) {
        res.status(500).json({ message: "Error creating drive link" });
    }
};

exports.getDriveLinks = async (req, res) => {
    try {
        const links = await DriveLink.find().sort({ createdAt: -1 });
        res.status(200).json(links);
    } catch (error) {
        res.status(500).json({ message: "Error fetching drive links" });
    }
};

exports.deleteDriveLink = async (req, res) => {
    try {
        await DriveLink.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Drive link deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting drive link" });
    }
};