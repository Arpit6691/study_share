const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, name, otp) => {
  console.log(`[EMAIL] Attempting to send OTP to ${email}...`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[EMAIL] ERROR: Missing credentials in environment variables.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps with some hosting provider restrictions
      }
    });

    const mailOptions = {
      from: `"StudyShare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - StudyShare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #7c5cff; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7c5cff; margin: 0;">StudyShare</h1>
            <p style="color: #666; font-size: 14px;">Your Gateway to Better Grades</p>
          </div>
          <div style="padding: 20px; border-radius: 8px; background-color: #f9f9f9; border: 1px solid #eee;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #555; line-height: 1.5;">To complete your registration and start downloading notes, please use the verification code below:</p>
            <div style="background-color: #7c5cff; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #888; text-align: center;">This code will expire in 10 minutes. If you did not sign up, please disregard this message.</p>
          </div>
          <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 30px;">
            &copy; 2026 StudyShare Platform. Built with ❤️ for students.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Success! Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] CRITICAL ERROR:', error.message);
    return false;
  }
};

module.exports = { sendOTPEmail };
