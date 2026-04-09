const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables as early as possible
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log request information for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created');
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack 
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
  console.error('Current environment variables:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASSWORD')));
  process.exit(1);
}

// Check for other required variables
const requiredEnv = ['JWT_SECRET', 'GOOGLE_CLIENT_ID'];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.warn(`WARNING: ${env} is not defined! Using placeholder/default.`);
  }
});

console.log('Initializing MongoDB connection...');
const dbHost = MONGO_URI.includes('@') ? MONGO_URI.split('@')[1].split('/')[0] : 'localhost';
console.log(`Connecting to: ${dbHost}`);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('==> Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`==> Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('==> MongoDB connection error:', err.message);
    console.error('Full connection error detail:', err);
    process.exit(1);
  });

// Handle global errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
