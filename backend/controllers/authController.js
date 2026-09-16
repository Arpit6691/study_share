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
    let { name, username, email, password } = req.body;

    // 1. Basic validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    name = name.trim();
    username = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Email validation (Regex + Block disposable)
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    // 3. Password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // 4. Check if user already exists
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email is already registered. Please log in.' });
    }

    // Check if username is taken by someone else
    const userWithUsername = await User.findOne({ username });
    if (userWithUsername) {
      if (!user || userWithUsername.email !== cleanEmail) {
        return res.status(400).json({ message: 'Username is already taken by another user.' });
      }
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`\n========================================`);
    console.log(`[VERIFICATION OTP CODE] for ${cleanEmail}: [ ${otp} ]`);
    console.log(`========================================\n`);

    // 7. Create or Update User (unverified)
    if (user) {
      // Re-signing up as an unverified user - update info and send new OTP
      user.name = name;
      user.username = username;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      // New user registration
      user = await User.create({
        name,
        username,
        email: cleanEmail,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false
      });
    }

    // Attempt to send OTP email in background
    let emailSent = false;
    try {
      emailSent = await sendOTPEmail(cleanEmail, name, otp);
    } catch (e) {
      console.error('[EMAIL] Send exception:', e.message);
    }

    return res.status(201).json({
      message: emailSent 
        ? 'Registration successful! Verification code sent to your email.'
        : 'Registration successful! Verification code generated.',
      email: user.email,
      requiresVerification: true
    });
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name || user.email.split('@')[0],
      username: user.username || user.email.split('@')[0],
      email: user.email,
      uploadCount: user.uploadCount || 0,
      score: user.score || 0,
      createdAt: user.createdAt,
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
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`\n========================================`);
    console.log(`[RESENT OTP CODE] for ${user.email}: [ ${otp} ]`);
    console.log(`========================================\n`);

    sendOTPEmail(user.email, user.name || 'User', otp).catch(err => {
      console.error(`[EMAIL] Error resending OTP:`, err.message);
    });

    res.status(200).json({ message: 'Verification code sent!' });
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    const cleanInput = email.trim();
    const normalizedEmail = cleanInput.toLowerCase();
    const safeRegex = new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // Allow login by email (case-insensitive) or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: safeRegex }
      ]
    });

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
        name: user.name || user.email.split('@')[0],
        username: user.username || user.email.split('@')[0],
        email: user.email,
        uploadCount: user.uploadCount || 0,
        score: user.score || 0,
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
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = user.toObject();
    if (!userObj.name) userObj.name = userObj.email.split('@')[0];
    if (!userObj.username) userObj.username = userObj.email.split('@')[0];
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ score: -1 })
      .limit(5)
      .select('-password');
    res.status(200).json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!googleClientId) {
      return res.status(500).json({ message: 'Google Client ID is not configured on the backend.' });
    }
    
    const oauthClient = new OAuth2Client(googleClientId);
    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      console.error("Google Token verification failed:", tokenErr);
      return res.status(401).json({ message: 'Google token verification failed: ' + tokenErr.message });
    }
    
    const { name, email } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Google account does not provide a valid email' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });
    
    if (user) {
      // Google users are automatically verified
      user.isVerified = true;
      if (!user.name && name) user.name = name;
      if (!user.username) {
        const baseUsername = (name ? name.toLowerCase().replace(/[^a-z0-9_]/g, '') : cleanEmail.split('@')[0]).slice(0, 15) || 'user';
        let finalUsername = baseUsername;
        let counter = 1;
        while (await User.findOne({ username: finalUsername, _id: { $ne: user._id } })) {
          finalUsername = `${baseUsername}${counter}`;
          counter++;
        }
        user.username = finalUsername;
      }
      if (!user.password) {
        user.password = await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), 10);
      }
      await user.save();

      return res.json({
        _id: user.id,
        name: user.name || cleanEmail.split('@')[0],
        username: user.username || cleanEmail.split('@')[0],
        email: user.email,
        uploadCount: user.uploadCount || 0,
        score: user.score || 0,
        createdAt: user.createdAt,
        token: generateToken(user._id)
      });
    } else {
      // Create user if they don't exist
      const generatedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), 10);
      
      const baseUsername = (name ? name.toLowerCase().replace(/[^a-z0-9_]/g, '') : cleanEmail.split('@')[0]).slice(0, 15) || 'user';
      let finalUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        username: finalUsername,
        email: cleanEmail,
        password: generatedPassword, 
        isVerified: true // Google users are pre-verified
      });
      
      return res.status(201).json({
        _id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        uploadCount: user.uploadCount || 0,
        score: user.score || 0,
        createdAt: user.createdAt,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(500).json({ message: 'Authentication error: ' + error.message });
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
