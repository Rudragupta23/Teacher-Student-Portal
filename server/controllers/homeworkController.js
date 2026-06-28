const Homework = require('../models/Homework');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail'); // Add this import at the top

exports.assignHomework = async (req, res) => {
  const { title, weekNo, topic, description, type, studentId, difficulty, dueDate, fileUrl, content, mcqs } = req.body;
  
  try {
    let targetStudents = [];
    
    if (studentId === 'all') {
      targetStudents = await User.find({ role: 'student' });
    } else {
      const student = await User.findById(studentId);
      if (student) targetStudents.push(student);
    }

    if (targetStudents.length === 0) return res.status(404).json({ message: 'No students found!' });

    if (new Date(dueDate) <= new Date()) {
      return res.status(400).json({ message: 'Due date must be in the future!' });
    }

    const homeworkPromises = targetStudents.map(student => 
      Homework.create({
        title, 
        weekNo, 
        topic,
        description, 
        type, 
        difficulty,
        fileUrl: type === 'File' ? fileUrl : undefined,
        content: type === 'Text' ? content : undefined,
        mcqs: type === 'MCQ' ? mcqs : [],
        dueDate: new Date(dueDate),
        studentId: student._id,
        adminId: req.user._id
      })
    );

    await Promise.all(homeworkPromises);

    // --- NEW EMAIL NOTIFICATION LOGIC ---
    // Extract emails, ensuring we don't include any undefined or null emails
    const studentEmails = targetStudents.map(student => student.email).filter(email => email);

    if (studentEmails.length > 0) {
      // Format the date to be easily readable
      const formattedDueDate = new Date(dueDate).toLocaleString(); 

      const emailContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #2563eb; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📝 New Homework Assigned</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello Student,</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Your teacher has assigned new homework for you. Please review the details below:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 120px;"><strong>Title</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">${title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Deadline</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #ef4444; font-weight: 600;">${formattedDueDate}</td>
                        </tr>
                    </table>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your student dashboard to view the instructions and submit your work.</p>
                </div>
            </div>
        </div>
      `;

      sendEmail({
        email: studentEmails.join(','), // This sends to all targeted students
        subject: `New Homework Assigned: ${title}`,
        html: emailContent
      });
    }
    // ------------------------------------

    res.status(201).json({ message: `Successfully assigned to ${targetStudents.length} student(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find().populate('studentId', 'name email registrationName yearGroup').sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find({ studentId: req.user._id })
                                    .sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitHomework = async (req, res) => {
  const { id } = req.params;
  const { answerText, answerFileUrl, mcqAnswers } = req.body;
  
  try {
    const homework = await Homework.findOne({ _id: id, studentId: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    if (new Date() > new Date(homework.dueDate)) {
      return res.status(403).json({ message: 'You are late! The deadline has passed. Please contact your teacher to extend the duration.' });
    }

    // --- HELPER TO SEND EMAIL TO ADMINS ---
    const notifyAdmins = async (studentName) => {
      const admins = await User.find({ role: 'admin' });
      const emailContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #f97316; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📥 New Submission</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello Admin,</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">A student has just turned in their work.</p>
                    
                    <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 20px; margin: 25px 0; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Student:</strong> <span style="color: #9a3412; font-weight: bold;">${studentName}</span></p>
                        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Assignment:</strong> <span style="color: #9a3412; font-weight: bold;">${homework.title}</span></p>
                        <p style="margin: 0; font-size: 16px;"><strong>Status:</strong> <span style="color: ${new Date() > new Date(homework.dueDate) ? '#dc2626' : '#16a34a'}; font-weight: bold;">${new Date() > new Date(homework.dueDate) ? '⚠️ Submitted LATE' : '✅ Submitted On Time'}</span></p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your admin dashboard to review and grade it.</p>
                </div>
            </div>
        </div>
      `;
      admins.forEach(admin => {
        if(admin.email) {
          sendEmail({ email: admin.email, subject: `Homework Submitted by ${studentName}`, html: emailContent });
        }
      });
    };
    // --------------------------------------

    // Fetch student details for the email
    const student = await User.findById(req.user._id);

    if (homework.type === 'MCQ') {
      let correctCount = 0;
      const totalQuestions = homework.mcqs.length;

      // --- FIX: Strictly parse answers whether they arrive as an Array, JSON string, or comma-separated string ---
      let parsedAnswers = [];
      if (Array.isArray(mcqAnswers)) {
        parsedAnswers = mcqAnswers;
      } else if (typeof mcqAnswers === 'string') {
        try {
          parsedAnswers = JSON.parse(mcqAnswers);
        } catch (e) {
          parsedAnswers = mcqAnswers.split(','); // Fallback for "1,2" stringified array
        }
      } else if (typeof mcqAnswers === 'object' && mcqAnswers !== null) {
        parsedAnswers = mcqAnswers;
      }

      homework.mcqs.forEach((mcq, idx) => {
        // Support both array indices and object mappings
        let studentAns = parsedAnswers[mcq._id] !== undefined ? parsedAnswers[mcq._id] : parsedAnswers[idx];

        if (studentAns !== null && studentAns !== undefined && studentAns !== '') {
          // Strictly compare numerical index only, preventing false text matches
          if (parseInt(studentAns) === parseInt(mcq.correctOption)) {
            correctCount++;
          }
        }
      });

      homework.status = 'Graded';
      homework.grading = { score: correctCount, totalScore: totalQuestions, feedback: 'Auto-graded MCQ Submission', gradedAt: new Date() };
      homework.submission = { submittedAt: new Date() };
      homework.mcqs = []; 
      
      await homework.save();
      
      notifyAdmins(student.registrationName || student.name); // Trigger Email to Admin

      // --- NEW: NOTIFY STUDENT & PARENT OF AUTO-GRADE ---
      const score = correctCount;
      const totalScore = totalQuestions;

      // 1. Notify Student
      if (student.email) {
        const studentEmailContent = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                  <div style="background-color: #10b981; padding: 25px; text-align: center;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ MCQ Graded</h2>
                  </div>
                  <div style="padding: 30px;">
                      <p style="font-size: 16px; margin-bottom: 20px;">Hello ${student.registrationName || student.name},</p>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Your MCQ submission for <strong>${homework.title}</strong> has been auto-graded.</p>
                      
                      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
                          <p style="margin: 0; font-size: 14px; color: #059669; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Score</p>
                          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: 800; color: #065f46;">${score} <span style="font-size: 20px; color: #10b981;">/ ${totalScore}</span></p>
                      </div>

                      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Log in to your student dashboard for full details.</p>
                  </div>
              </div>
          </div>
        `;

        sendEmail({
          email: student.email,
          subject: `Your Homework has been Graded: ${homework.title}`,
          html: studentEmailContent
        });
      }

      // 2. Notify Parent
      const parents = await User.find({
        role: 'parent',
        $or: [
          { linkedStudentId: student._id.toString() },
          { linkedStudentId: student.studentId }
        ]
      });

      if (parents.length > 0) {
        const parentEmailContent = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                  <div style="background-color: #10b981; padding: 25px; text-align: center;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📊 Academic Update</h2>
                  </div>
                  <div style="padding: 30px;">
                      <p style="font-size: 16px; margin-bottom: 20px;">Hello Parent,</p>
                      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">A new grade has been auto-calculated for your child, <strong>${student.registrationName || student.name}</strong>, for the MCQ assignment <strong>${homework.title}</strong>.</p>
                      
                      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 25px 0; border-radius: 8px;">
                          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Score Achieved:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${score} / ${totalScore}</span></p>
                      </div>

                      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your Parent Dashboard for a complete overview of your child's progress.</p>
                  </div>
              </div>
          </div>
        `;

        const parentEmails = parents.map(p => p.email).filter(email => email);

        if (parentEmails.length > 0) {
          sendEmail({
            email: parentEmails.join(','),
            subject: `Update: ${student.registrationName || student.name}'s Homework has been Graded`,
            html: parentEmailContent
          });
        }
      }
      // --------------------------------------------------

      return res.status(200).json({ message: 'MCQ - graded successfully!', homework });
    }

    homework.status = 'Submitted';
    homework.submission = { answerText, answerFileUrl, submittedAt: new Date() };
    await homework.save();

    notifyAdmins(student.registrationName || student.name); // Trigger Email

    res.status(200).json({ message: 'Homework submitted successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.gradeHomework = async (req, res) => {
  const { id } = req.params;
  const { score, totalScore, feedback, adminAnswerSheetUrl } = req.body;
  
  try {
    const homework = await Homework.findById(id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    // --- NEW SECURITY CHECK: Prevent graders from editing published marks ---
    if (homework.status === 'Graded' && req.user.role === 'grader') {
      return res.status(403).json({ message: 'Action Denied: Graders cannot edit marks once they are published. Please contact the Main Admin to request a change.' });
    }
    // ----------------------------------------------------------------------

    // --- NEW SMART CHECK ---

    // --- NEW SMART CHECK ---
    // If the homework previously had a marked file, but the new request is empty, 
    // it means the admin is just clicking "Remove Marked Work".
    const isRemovingMarkedWork = homework.grading && homework.grading.adminAnswerSheetUrl && !adminAnswerSheetUrl;

    homework.status = 'Graded';
    homework.grading = {
      score: score !== undefined && score !== '' ? Number(score) : null,
      totalScore: totalScore !== undefined && totalScore !== '' ? Number(totalScore) : null,
      feedback: feedback || '',
      adminAnswerSheetUrl: adminAnswerSheetUrl || '',
      gradedAt: new Date(),
      gradedBy: req.user._id // Stores the Main Admin or Grader ID
    };
    
    homework.markModified('grading'); 
    
    homework.fileUrl = undefined;
    homework.content = undefined;
    homework.mcqs = [];

    if (homework.submission) {
      homework.submission.answerText = undefined;
      homework.submission.answerFileUrl = undefined;
      homework.markModified('submission'); 
    }

    await homework.save();

    // --- ONLY SEND EMAILS IF WE ARE NOT JUST REMOVING THE FILE ---
    if (!isRemovingMarkedWork) {
      const student = await User.findById(homework.studentId);

      if (student) {

        // 1. NOTIFY THE STUDENT
        if (student.email) {
          
          // --- FIX: Define checkedWorkHtml before using it ---
          const checkedWorkHtml = homework.grading.adminAnswerSheetUrl ? `
            <div style="margin-bottom: 25px; padding: 15px; background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px;">
              <h4 style="margin: 0 0 5px 0; color: #0369a1;">📎 Marked Work Attached:</h4>
              <p style="margin: 0; font-size: 14px; color: #0c4a6e;">Your teacher has uploaded a marked document for review.</p>
            </div>
          ` : '';
          const studentEmailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #10b981; padding: 25px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ Homework Graded</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello ${student.registrationName || student.name},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Your teacher has reviewed and graded your submission for <strong>${homework.title}</strong>.</p>
                        
                        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #059669; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Score</p>
                            <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: 800; color: #065f46;">${score} <span style="font-size: 20px; color: #10b981;">/ ${totalScore}</span></p>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <h4 style="margin: 0 0 10px 0; color: #374151;">Teacher's Feedback:</h4>
                            <p style="margin: 0; color: #4b5563; font-style: italic; background: #f9fafb; padding: 15px; border-radius: 6px;">"${feedback || 'Great effort! Please check your dashboard for any detailed notes.'}"</p>
                        </div>
                        
                        ${checkedWorkHtml}
                        
                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Log in to your student dashboard for full details.</p>
                    </div>
                </div>
            </div>
          `;

          sendEmail({
            email: student.email,
            subject: `Your Homework has been Graded: ${homework.title}`,
            html: studentEmailContent
          });
        }

        // 2. NOTIFY THE PARENT(S)
        const parents = await User.find({
          role: 'parent',
          $or: [
            { linkedStudentId: student._id.toString() },
            { linkedStudentId: student.studentId }
          ]
        });

        if (parents.length > 0) {
          const parentEmailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #10b981; padding: 25px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📊 Academic Update</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello Parent,</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">A new grade has been posted for your child, <strong>${student.registrationName || student.name}</strong>, for the assignment <strong>${homework.title}</strong>.</p>
                        
                        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 25px 0; border-radius: 8px;">
                            <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Score Achieved:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${score} / ${totalScore}</span></p>
                        </div>

                        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please log in to your Parent Dashboard for a complete overview of your child's progress.</p>
                    </div>
                </div>
            </div>
          `;

          const parentEmails = parents.map(p => p.email).filter(email => email);

          if (parentEmails.length > 0) {
            sendEmail({
              email: parentEmails.join(','),
              subject: `Update: ${student.registrationName || student.name}'s Homework has been Graded`,
              html: parentEmailContent
            });
          }
        }
      }
    }

    res.status(200).json({ message: 'Graded successfully! Document updated.', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.extendDeadline = async (req, res) => {
  const { id } = req.params;
  const { newDueDate } = req.body; 

  try {
    const homework = await Homework.findById(id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    if (new Date(newDueDate) <= new Date()) {
      return res.status(400).json({ message: 'New due date must be in the future!' });
    }

    homework.dueDate = new Date(newDueDate);
    
    if (homework.status !== 'Graded') homework.status = 'Pending';
    
    // Reset the reminder flag so they can get a new 24-hour reminder for the new date
    homework.reminderSent = false;
    
    await homework.save();

    // --- NEW EMAIL NOTIFICATION LOGIC ---
    // Fetch the specific student to get their email and name
    const student = await User.findById(homework.studentId);

    if (student && student.email) {
      const formattedNewDate = new Date(newDueDate).toLocaleString();

      const emailContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #3b82f6; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📅 Deadline Extended</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${student.registrationName || student.name},</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Your teacher has granted an extension for your assignment: <strong>${homework.title}</strong>.</p>
                    
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; font-size: 16px; color: #1e3a8a;"><strong>New Deadline:</strong> <span style="color: #2563eb; font-weight: bold;">${formattedNewDate}</span></p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">Please ensure you submit your work before this new deadline.</p>
                </div>
            </div>
        </div>
      `;

      sendEmail({
        email: student.email,
        subject: `Deadline Extended: ${homework.title}`,
        html: emailContent
      });
    }
    // ------------------------------------

    res.status(200).json({ message: 'Deadline extended successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    if (req.user.role === 'grader') {
      return res.status(403).json({ message: 'Graders are not allowed to delete homework.' });
    }
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    await Homework.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Assignment permanently deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};