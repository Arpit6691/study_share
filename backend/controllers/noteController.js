const Note = require('../models/Note');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { extractPdfText, validateStudyDocument } = require('../services/geminiDocumentValidator');

const uploadNote = async (req, res) => {
  try {
    const { title, subject, semester, course } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    
    if (!title || !subject || !semester || !course) {
      // Remove the uploaded file if validation fails
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ success: false, message: 'Please provide title, subject, semester, and course' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let validationResult = null;

    // Check if the uploaded document is a PDF and perform AI-based domain validation
    if (ext === '.pdf') {
      try {
        console.log(`[DocumentValidation] Processing uploaded PDF: ${req.file.originalname}`);
        const { text } = await extractPdfText(req.file.path);
        console.log(`[DocumentValidation] Text extracted (${text.length} characters)`);

        if (!text || text.trim().length < 30) {
          if (fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
          }
          return res.status(400).json({
            success: false,
            message: 'This PDF does not contain sufficient readable text or appears to be empty/scanned without extractable text.',
            reason: 'Insufficient readable text content found in document for academic domain validation.'
          });
        }

        validationResult = await validateStudyDocument(text, {
          title,
          subject,
          semester,
          course,
          originalFileName: req.file.originalname,
        });

        if (!validationResult.isValid) {
          if (fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
          }
          return res.status(400).json({
            success: false,
            message: 'This PDF does not appear to contain valid academic study material.',
            reason: validationResult.reason || 'Document does not match allowed study material domain.',
            category: validationResult.category,
            confidence: validationResult.confidence,
          });
        }
      } catch (validationErr) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        console.error('[DocumentValidation] Validation pipeline error:', validationErr.message);
        return res.status(400).json({
          success: false,
          message: 'Document validation is temporarily unavailable. Please try again.',
          error: validationErr.message,
        });
      }
    }

    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      semester: semester.toString().trim(),
      course: course.trim(),
      fileUrl: req.file.filename,
      originalFileName: req.file.originalname,
      uploadedBy: req.user._id || req.user.id,
      aiCategory: validationResult?.category || null,
      aiConfidence: validationResult?.confidence || null,
    });

    // Increment user's upload count and score
    await User.findByIdAndUpdate(req.user._id || req.user.id, {
      $inc: { uploadCount: 1, score: 10 }
    });

    res.status(201).json({
      ...note.toObject(),
      success: true,
      message: 'Document uploaded successfully.',
      validation: validationResult ? {
        category: validationResult.category,
        confidence: validationResult.confidence,
        reason: validationResult.reason
      } : null
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error('Upload note controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload note' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { subject, semester, course, search } = req.query;
    let query = {};

    if (course) {
      query.course = course;
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (semester) {
      query.semester = semester;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Add fileType filter
    const { fileType } = req.query;
    if (fileType) {
      // fileType might specify pdf, doc, ppt, etc.
      query.originalFileName = { $regex: `\\.${fileType}$`, $options: 'i' };
    }

    // Exclude uploadedBy from results to maintain anonymity, or just not populate it
    const notes = await Note.find(query).select('-uploadedBy').sort({ createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);

    if (fs.existsSync(filePath)) {
      // Update note download count
      note.downloadCount += 1;
      await note.save();

      // Decrease user score slightly
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { score: -1 }
      });

      res.download(filePath, note.originalFileName);
    } else {
      res.status(404).json({ message: 'File not found on server' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const previewNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);

    if (fs.existsSync(filePath)) {
      // Send the file inline instead of as attachment
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found on server' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rateNote = async (req, res) => {
  try {
    const { rating } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existingRatingIndex = note.ratings.findIndex(r => r.user.toString() === req.user.id);
    
    if (existingRatingIndex >= 0) {
      note.ratings[existingRatingIndex].rating = rating;
    } else {
      note.ratings.push({ user: req.user.id, rating });
    }

    const totalRatings = note.ratings.reduce((acc, current) => acc + current.rating, 0);
    note.averageRating = totalRatings / note.ratings.length;

    await note.save();
    res.status(200).json({ averageRating: note.averageRating, ratingsCount: note.ratings.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyNotes = async (req, res) => {
  try {
    const { subject, semester, search } = req.query;
    let query = { uploadedBy: req.user.id };

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (semester) {
      query.semester = semester;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.uploadedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this note' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);
    
    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await note.deleteOne();

    // Decrement user's upload count and score
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { uploadCount: -1, score: -10 }
    });

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reportNote = async (req, res) => {
  try {
    const { reason } = req.body;
    const Report = require('../models/Report');

    const result = await Report.create({
      note: req.params.id,
      reportedBy: req.user.id,
      reason
    });

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadNote,
  getNotes,
  downloadNote,
  previewNote,
  rateNote,
  reportNote,
  getMyNotes,
  deleteNote,
};
