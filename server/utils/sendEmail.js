// const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name: 'MathCom Mentors', email: process.env.EMAIL_USER },
    to: [{ email: options.email }],
    subject: options.subject,
    htmlContent: options.html,
  }),
});

if (!response.ok) {
  throw new Error(`Brevo API error ${response.status}: ${await response.text()}`);
}
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;