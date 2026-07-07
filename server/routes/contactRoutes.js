const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #4f46e5; background-image: linear-gradient(to right, #4f46e5, #06b6d4); padding: 25px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">New Contact Request</h2>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #475569; margin-top: 0; margin-bottom: 25px;">
            You have received a new message from the <strong>MathCom Mentors</strong> portal contact form.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; width: 80px; font-weight: 600; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Name</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 500;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0;">
                <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">${email}</a>
              </td>
            </tr>
          </table>
          
          <h3 style="color: #334155; margin-top: 0; margin-bottom: 12px; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; color: #1e293b; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${message}</div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
          This is an automated message generated from the MathCom Mentors Student Portal.
        </div>
        
      </div>
    `;

    await sendEmail({
      email: process.env.EMAIL_USER, 
      subject: `New Message from ${name} | MathCom Mentors`,
      html: emailHtml,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

module.exports = router;