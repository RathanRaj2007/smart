const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'battularathanraj6@gmail.com',
      subject: 'Test Email from Node',
      text: 'This is a test email to see if sending actually works.'
    });
    console.log('Message sent: %s', info.messageId);
  } catch (err) {
    console.error('Error sending:', err);
  }
}
main();
