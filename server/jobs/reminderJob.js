const cron = require('node-cron');
const Homework = require('../models/Homework');
const sendEmail = require('../utils/sendEmail');

// This cron job runs at the top of every hour (e.g., 1:00, 2:00, 3:00)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running background check for upcoming homework deadlines...');
    
    const now = new Date();
    // Calculate the time exactly 24 hours from now
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find all homework that is:
    // 1. Due within the next 24 hours (dueDate is less than or equal to 'tomorrow' but greater than 'now')
    // 2. Not yet submitted or graded
    // 3. Has not already had a reminder sent
    const upcomingHomeworks = await Homework.find({
      dueDate: { $lte: tomorrow, $gt: now },
      status: { $nin: ['Submitted', 'Graded'] }, // Assuming 'Pending' status means not submitted
      reminderSent: { $ne: true }
    }).populate('studentId'); // Fetch the student details so we can get their email

    if (upcomingHomeworks.length > 0) {
      for (let hw of upcomingHomeworks) {
        if (hw.studentId && hw.studentId.email) {
          const formattedDate = new Date(hw.dueDate).toLocaleString();

          const emailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #f59e0b; padding: 25px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">⏰ Deadline Approaching!</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello ${hw.studentId.registrationName || hw.studentId.name},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">This is an automated reminder that your assignment <strong>${hw.title}</strong> is due in less than 24 hours.</p>
                        
                        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                            <p style="margin: 0; font-size: 16px; color: #92400e;"><strong>Deadline:</strong> <span style="color: #b91c1c; font-weight: bold;">${formattedDate}</span></p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your student dashboard to complete and submit it on time.</p>
                    </div>
                </div>
            </div>
          `;

          // Send the email
          await sendEmail({
            email: hw.studentId.email,
            subject: `Action Required: '${hw.title}' is due in 24 hours!`,
            html: emailContent
          });

          // Mark this specific homework as having received a reminder to prevent spam
          hw.reminderSent = true;
          await hw.save();
        }
      }
      console.log(`Sent 24-hour reminders for ${upcomingHomeworks.length} assignments.`);
    }
  } catch (error) {
    console.error('Error running homework reminder cron job:', error);
  }
});