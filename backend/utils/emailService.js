const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"StudyShare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - StudyShare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #7c5cff; text-align: center;">Welcome to StudyShare!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for joining our community. To complete your registration, please verify your email addresses by entering the following OTP:</p>
          <div style="background-color: #f4f2ff; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7c5cff;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 StudyShare. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = { sendOTPEmail };
