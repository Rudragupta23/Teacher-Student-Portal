const Scheme = require('../models/Scheme');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.createReport = async (req, res) => {
  try {
    const { date, startTime, endTime, title, weekNo, topic, description, classStatus, graderInstruction, yearGroupFilter, studentId } = req.body;
    
    const report = await Scheme.create({
      date, startTime, endTime, title, weekNo, topic, description, classStatus, graderInstruction, yearGroupFilter, studentId, adminId: req.user._id
    });

    let graders = [];
    
    if (studentId && studentId !== 'all') {
      graders = await User.find({ role: 'grader', allocatedStudents: studentId });
    } else {
      graders = await User.find({ role: 'grader' });
    }
    
    const graderEmails = graders.map(g => g.email).filter(email => email);

    if (graderEmails.length > 0) {
      let emailSubject = '';
      let emailHtml = '';

      if (classStatus === 'Class Taken') {
        emailSubject = `Class Completed: ${topic || title}`;
        emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="background-color: #10b981; padding: 25px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ Class Completed</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello Grader,</p>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">The class for today has been logged. You may now proceed to set the homework.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                  <tr>
                    <td style="padding: 8px; color: #6b7280;"><strong>Title:</strong></td>
                    <td style="padding: 8px; font-weight: 600;">${title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; color: #6b7280;"><strong>Week:</strong></td>
                    <td style="padding: 8px; font-weight: 600;">${weekNo || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; color: #6b7280;"><strong>Topic:</strong></td>
                    <td style="padding: 8px; font-weight: 600;">${topic || 'N/A'}</td>
                  </tr>
                </table>

                ${graderInstruction ? `
                  <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">Instructions for Grader:</p>
                    <p style="margin: 0; font-size: 15px; color: #1e40af; font-style: italic;">"${graderInstruction}"</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        emailSubject = `Class Cancelled: ${title}`;
        emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #374151;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="background-color: #ef4444; padding: 25px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">❌ ${classStatus}</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello Grader,</p>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">This is to inform you that the class was marked as <strong>${classStatus}</strong> today. No homework is required for this entry.</p>
              </div>
            </div>
          </div>
        `;
      }

      await sendEmail({ email: graderEmails.join(','), subject: emailSubject, html: emailHtml });
    }

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    let query = {};

    if (req.user) {
      if (req.user.role === 'student') {
        query = {
          $or: [
            { studentId: 'all' },
            { studentId: req.user._id.toString() }
          ]
        };
      } else if (req.user.role === 'parent') {
        let childIds = [];

        if (req.query.studentId) {
          childIds.push(req.query.studentId);
        }
        
        if (req.user.allocatedStudents && req.user.allocatedStudents.length > 0) {
          childIds = req.user.allocatedStudents.map(id => id.toString());
        }
        
        if (req.user.linkedStudentId) {
          try {
            const child = await User.findOne({ studentId: req.user.linkedStudentId });
            if (child) {
              childIds.push(child._id.toString());
            } else {
              const childById = await User.findById(req.user.linkedStudentId);
              if (childById) childIds.push(childById._id.toString());
            }
          } catch (e) {
          }
        }

        query = {
          $or: [
            { studentId: 'all' },
            { studentId: { $in: childIds } }
          ]
        };
      } else if (req.user.role === 'grader') {
        const allocatedStudentIds = req.user.allocatedStudents 
          ? req.user.allocatedStudents.map(id => id.toString()) 
          : [];
          
        query = {
          $or: [
            { studentId: 'all' },
            { studentId: { $in: allocatedStudentIds } }
          ]
        };
      }
    }
    const reports = await Scheme.find(query).sort({ date: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteReport = async (req, res) => {
  try {
    await Scheme.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllReports = async (req, res) => {
  try {
    await Scheme.deleteMany({});
    res.status(200).json({ success: true, message: 'All reports deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a lesson scheme
// @route   PUT /api/scheme/:id
exports.updateScheme = async (req, res) => {
  try {
    const updatedScheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedScheme);
  } catch (error) {
    res.status(500).json({ message: 'Error updating scheme', error: error.message });
  }
};