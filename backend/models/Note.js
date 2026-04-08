const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // will be hidden in responses
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true }
  }],
  averageRating: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
