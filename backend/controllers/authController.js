const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { validateEmail, validatePassword } = require('../utils/validation');
const { sendOTPEmail } = require('../utils/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Register User with Email Verification (OTP)
 */
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // 1. Basic validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // 2. Email validation (Regex + Block disposable)
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    // 3. Password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // 4. Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email is already registered. Please log in.' });
    }

    // Check if username is taken by someone else
    const userWithUsername = await User.findOne({ username });
    if (userWithUsername) {
      if (!user || userWithUsername.email !== email) {
        return res.status(400).json({ message: 'Username is already taken by another user.' });
      }
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 7. Create or Update User (unverified)
    if (user) {
      // Re-signing up as an unverified user - update info and send new OTP
      user.name = name;
      user.username = username;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      console.log(`Unverified user ${email} updated. Re-sending OTP...`);
    } else {
      // New user registration
      user = await User.create({
        name,
        username,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false
      });
      console.log(`New user created: ${email}. Sending OTP...`);
    }

    if (user) {
      // Send OTP Email in background
      sendOTPEmail(email, name, otp).then(sent => {
        if (!sent) console.error(`Failed to send OTP to ${email}`);
        else console.log(`OTP sent successfully to ${email}`);
      });

      return res.status(201).json({
        message: 'Registration successful! Verification code sent.',
        email: user.email,
        requiresVerification: true
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
      message: 'Email verified successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Resend OTP
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const emailSent = await sendOTPEmail(user.email, user.name, otp);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(200).json({ message: 'Verification code resent successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login User
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // 1. Check if verified
      if (!user.isVerified) {
        return res.status(401).json({ 
          message: 'Please verify your email before logging in.',
          requiresVerification: true,
          email: user.email
        });
      }

      res.json({
        _id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        uploadCount: user.uploadCount,
        score: user.score,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ score: -1 })
      .limit(10)
      .select('-password');
    res.status(200).json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { name, email } = payload;
    
    let user = await User.findOne({ email });
    
    if (user) {
      // Google users are automatically verified
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      res.json({
        _id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        uploadCount: user.uploadCount,
        score: user.score,
        token: generateToken(user._id)
      });
    } else {
      // Create user if they don't exist
      const generatedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), 10);
      // Generate username from email or name
      const baseUsername = name.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name,
        username: finalUsername,
        email,
        password: generatedPassword, 
        isVerified: true // Google users are pre-verified
      });
      
      res.status(201).json({
        _id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        uploadCount: user.uploadCount,
        score: user.score,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error("Google Auth error", error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
};

/**
 * Diagnostic: Test Email Settings
 */
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Target email is required' });
    
    console.log(`Running diagnostic email test for: ${email}`);
    const result = await sendOTPEmail(email, "Tester", "123456");
    
    if (result) {
      res.status(200).json({ message: 'Test email sent! Check your inbox/spam.' });
    } else {
      res.status(500).json({ message: 'Email test failed. Check server logs for the exact error.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  getMe,
  getLeaderboard,
  googleAuth,
  testEmail,
};
