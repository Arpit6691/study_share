const Note = require('../models/Note');
const User = require('../models/User');
const path = require('path');
const { extractPdfText, validateStudyDocument } = require('../services/geminiDocumentValidator');
const cloudinary = require('../utils/cloudinary');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Download a remote URL to a temporary local file.
 * Returns the temp file path; caller is responsible for cleanup.
 */
const downloadToTemp = (url) =>
  new Promise((resolve, reject) => {
    const ext = path.extname(new URL(url).pathname) || '.pdf';
    const tmpPath = path.join(os.tmpdir(), `studyshare-${Date.now()}${ext}`);
    const file = fs.createWriteStream(tmpPath);
    const protocol = url.startsWith('https') ? https : http;
    protocol
      .get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(tmpPath)));
      })
      .on('error', (err) => {
        fs.unlink(tmpPath, () => {});
        reject(err);
      });
  });

// ─── Controllers ──────────────────────────────────────────────────────────────

const uploadNote = async (req, res) => {
  try {
    const { title, subject, semester, course } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    if (!title || !subject || !semester || !course) {
      // Remove the file from Cloudinary if validation fails
      if (req.file.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }); } catch (e) {}
      }
      return res.status(400).json({ success: false, message: 'Please provide title, subject, semester, and course' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let validationResult = null;

    // AI-based domain validation for PDFs
    if (ext === '.pdf') {
      let tmpPath = null;
      try {
        console.log(`[DocumentValidation] Processing uploaded PDF: ${req.file.originalname}`);

        // The file is now on Cloudinary — download it temporarily for text extraction
        const cloudinaryUrl = req.file.path; // multer-storage-cloudinary sets req.file.path = secure_url
        tmpPath = await downloadToTemp(cloudinaryUrl);

        const { text } = await extractPdfText(tmpPath);
        console.log(`[DocumentValidation] Text extracted (${text.length} characters)`);

        if (!text || text.trim().length < 30) {
          try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }); } catch (e) {}
          return res.status(400).json({
            success: false,
            message: 'This PDF does not contain sufficient readable text or appears to be empty/scanned without extractable text.',
            reason: 'Insufficient readable text content found in document for academic domain validation.',
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
          try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }); } catch (e) {}
          return res.status(400).json({
            success: false,
            message: 'These notes do not belong to this subject. Kindly re-upload relevant study material.',
            category: validationResult.category,
            confidence: validationResult.confidence,
          });
        }
      } catch (validationErr) {
        // If validation service itself fails (API down, key issue, quota, timeout),
        // log the error but DO NOT block the upload — just skip AI validation.
        console.warn('[DocumentValidation] Validation service error (skipping validation):', validationErr.message);
        validationResult = null; // treat as unvalidated — upload proceeds
      } finally {
        if (tmpPath) {
          try { fs.unlinkSync(tmpPath); } catch (e) {}
        }
      }
    }

    // req.file.path   = Cloudinary secure URL  (e.g. https://res.cloudinary.com/...)
    // req.file.filename = Cloudinary public_id (e.g. study_share_uploads/file-1234567890.pdf)
    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      semester: semester.toString().trim(),
      course: course.trim(),
      fileUrl: req.file.path,           // full Cloudinary HTTPS URL
      cloudinaryPublicId: req.file.filename, // public_id for deletion
      originalFileName: req.file.originalname,
      uploadedBy: req.user._id || req.user.id,
      aiCategory: validationResult?.category || null,
      aiConfidence: validationResult?.confidence || null,
    });

    await User.findByIdAndUpdate(req.user._id || req.user.id, {
      $inc: { uploadCount: 1, score: 10 },
    });

    res.status(201).json({
      ...note.toObject(),
      success: true,
      message: 'Document uploaded successfully.',
      validation: validationResult
        ? { category: validationResult.category, confidence: validationResult.confidence, reason: validationResult.reason }
        : null,
    });
  } catch (error) {
    // Clean up Cloudinary file on unexpected error
    if (req.file?.filename) {
      try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }); } catch (e) {}
    }
    console.error('Upload note controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload note' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { subject, semester, course, search, fileType } = req.query;
    let query = {};

    if (course) query.course = course;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (semester) query.semester = semester;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (fileType) query.originalFileName = { $regex: `\\.${fileType}$`, $options: 'i' };

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

    if (!note.fileUrl) {
      return res.status(404).json({ message: 'No file URL found for this note.' });
    }

    // Update download count & deduct score
    note.downloadCount += 1;
    await note.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { score: -1 } });

    // Stream the file from Cloudinary through to the client
    const protocol = note.fileUrl.startsWith('https') ? https : http;
    const fileName = encodeURIComponent(note.originalFileName || 'download');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    protocol.get(note.fileUrl, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        console.error(`[Download] Cloudinary returned ${cloudRes.statusCode} for note "${note.title}"`);
        return res.status(404).json({
          message: 'The file could not be retrieved from cloud storage. It may have been removed.',
        });
      }
      cloudRes.pipe(res);
    }).on('error', (err) => {
      console.error('[Download] Stream error:', err.message);
      res.status(500).json({ message: 'Failed to stream file from cloud storage.' });
    });
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

    if (!note.fileUrl) {
      return res.status(404).json({ message: 'No file URL found for this note.' });
    }

    // Redirect browser directly to the Cloudinary URL for inline preview
    res.redirect(note.fileUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rateNote = async (req, res) => {
  try {
    const { rating } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

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

    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (semester) query.semester = semester;
    if (search) query.title = { $regex: search, $options: 'i' };

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.uploadedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this note' });
    }

    // Delete from Cloudinary if we have a public_id stored
    if (note.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(note.cloudinaryPublicId, { resource_type: 'raw' });
        console.log(`[Delete] Cloudinary file removed: ${note.cloudinaryPublicId}`);
      } catch (cloudErr) {
        console.warn(`[Delete] Could not remove Cloudinary file: ${cloudErr.message}`);
      }
    }

    await note.deleteOne();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { uploadCount: -1, score: -10 },
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
    await Report.create({ note: req.params.id, reportedBy: req.user.id, reason });
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
