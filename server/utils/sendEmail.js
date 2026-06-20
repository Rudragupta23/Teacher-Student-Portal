const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Create the transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the email content
    const mailOptions = {
      from: `Homework Portal <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html, // Using HTML allows us to make the email look professional
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;