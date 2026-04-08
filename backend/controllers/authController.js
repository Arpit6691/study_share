const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
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
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getLeaderboard,
  googleAuth,
};
