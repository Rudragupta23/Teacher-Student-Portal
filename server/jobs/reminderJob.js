const cron = require('node-cron');
const Homework = require('../models/Homework');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// This cron job runs at the top of every hour (e.g., 1:00, 2:00, 3:00)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running background check for upcoming homework deadlines...');
    
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    // PARENT REMINDER 
    const parentDue = await Homework.find({
      dueDate: { $lte: in72Hours, $gt: now },
      status: { $nin: ['Submitted', 'Graded'] },
      parentReminderSent: { $ne: true }
    }).populate('studentId');

    for (let hw of parentDue) {
      if (!hw.studentId) continue;

      const student = hw.studentId;
      const studentName = student.registrationName || student.name;
      const dueOn = new Date(hw.dueDate).toLocaleString();

      const parents = await User.find({
        role: 'parent',
        $or: [
          { linkedStudentId: student._id.toString() },
          { linkedStudentId: student.studentId }
        ]
      });

      hw.parentReminderSent = true;
      await hw.save();

      if (parents.length === 0) continue;

      const parentEmailContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #6366f1; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Upcoming Deadline</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">This is an advance reminder that <strong>${studentName}</strong> has an assignment, <strong>${hw.title}</strong>, due in around 3 days.</p>

                    <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-left: 4px solid #6366f1; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; font-size: 16px; color: #3730a3;"><strong>Deadline:</strong> <span style="color: #b91c1c; font-weight: bold;">${dueOn}</span></p>
                    </div>

                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Log in to your Parent Dashboard to track progress.</p>
                </div>
            </div>
        </div>
      `;

      const parentEmails = parents.map(p => p.email).filter(Boolean);
      if (parentEmails.length > 0) {
        await sendEmail({
          email: parentEmails.join(','),
          subject: `Reminder: ${studentName}'s assignment is due in 3 days`,
          html: parentEmailContent
        });
      }

      const parentPhones = parents.map(p => p.phone).filter(Boolean);
      for (const phone of parentPhones) {
        await sendSMS({
          phone,
          message: `MathCom Mentors: ${studentName} has an assignment "${hw.title}" due in 3 days. Please check the Parent Dashboard.`
        });
      }
    }

    if (parentDue.length > 0) {
      console.log(`Sent 72-hour parent reminders for ${parentDue.length} assignments.`);
    }

    // Find all homework that is:
    // 1. Due within the next 48 hours
    // 2. Not yet submitted or graded
    // 3. Has not already had a reminder sent 
    const upcomingHomeworks = await Homework.find({
      dueDate: { $lte: in48Hours, $gt: now },
      status: { $nin: ['Submitted', 'Graded'] }, 
      reminderSent: { $ne: true }
    }).populate('studentId');

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
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">This is an automated reminder that your assignment <strong>${hw.title}</strong> is due in less than 48 hours.</p>
                        
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
            subject: `Action Required: '${hw.title}' is due in 48 hours!`,
            html: emailContent
          });

          hw.reminderSent = true;
          await hw.save();

          if (hw.studentId.phone) {
            await sendSMS({
              phone: hw.studentId.phone,
              message: `MathCom Mentors Reminder: Your assignment "${hw.title}" is due in less than 48 hours!`
            });
          }
        }
      }
      console.log(`Sent 48-hour student reminders for ${upcomingHomeworks.length} assignments.`);
    }
  } catch (error) {
    console.error('Error running homework reminder cron job:', error);
  }
});