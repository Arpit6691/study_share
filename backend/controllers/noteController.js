const Note = require('../models/Note');
const User = require('../models/User');
const path = require('path');
const { extractPdfTextFromBuffer, validateStudyDocument } = require('../services/geminiDocumentValidator');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');
const fs = require('fs');


/**
 * Uploads a buffer to Cloudinary using a stream (no temp file needed).
 */
const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

// ─── Controllers ──────────────────────────────────────────────────────────────

const uploadNote = async (req, res) => {
  let cloudinaryPublicId = null; // track for cleanup on failure

  try {
    const { title, subject, semester, course } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    if (!title || !subject || !semester || !course) {
      return res.status(400).json({ success: false, message: 'Please provide title, subject, semester, and course' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let validationResult = null;

    // ── STEP 1: Validate PDF from in-memory buffer (BEFORE uploading to Cloudinary) ──
    if (ext === '.pdf') {
      try {
        console.log(`[Upload] Validating PDF: ${req.file.originalname} (${req.file.size} bytes)`);

        if (!req.file.buffer || req.file.buffer.length === 0) {
          return res.status(400).json({ success: false, message: 'Uploaded file is empty.' });
        }

        const { text } = await extractPdfTextFromBuffer(req.file.buffer);
        console.log(`[Upload] Extracted ${text.length} chars of text`);

        if (!text || text.trim().length < 30) {
          return res.status(400).json({
            success: false,
            message: 'This PDF does not contain sufficient readable text. It may be a scanned image or empty.',
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
          return res.status(400).json({
            success: false,
            message: 'These notes do not belong to this subject. Kindly re-upload relevant study material.',
            category: validationResult.category,
            confidence: validationResult.confidence,
          });
        }

      } catch (validationErr) {
        console.error('[Upload] Validation error:', validationErr.message);

        const isServiceError =
          validationErr.isServiceError === true ||
          validationErr.message?.includes('GEMINI_SERVICE_UNAVAILABLE') ||
          validationErr.message?.toLowerCase().includes('503') ||
          validationErr.message?.toLowerCase().includes('overload') ||
          validationErr.message?.toLowerCase().includes('quota') ||
          validationErr.message?.toLowerCase().includes('unavailable') ||
          validationErr.message?.toLowerCase().includes('network') ||
          validationErr.message?.toLowerCase().includes('timeout');

        if (isServiceError) {
          // Gemini is down — fail open, allow upload with warning
          console.warn('[Upload] Gemini unavailable — allowing upload without validation');
          validationResult = {
            isValid: true,
            category: 'Unverified',
            confidence: null,
            reason: 'AI validation temporarily unavailable. Document accepted without AI review.',
          };
        } else {
          // Hard error (corrupt PDF, parse failure) — reject
          return res.status(400).json({
            success: false,
            message: 'Document could not be validated. Please ensure your PDF is readable and try again.',
            reason: validationErr.message,
          });
        }
      }
    }

    // ── STEP 2: Upload validated file to Cloudinary via stream ──
    console.log(`[Upload] Uploading to Cloudinary...`);
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'study_share_uploads',
      resource_type: 'raw',
      format: ext.replace('.', ''),
      public_id: `file-${Date.now()}`,
    });

    cloudinaryPublicId = uploadResult.public_id;
    const cloudinaryUrl = uploadResult.secure_url;
    console.log(`[Upload] Cloudinary upload OK: ${cloudinaryUrl}`);

    // ── STEP 3: Save note to MongoDB ──
    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      semester: semester.toString().trim(),
      course: course.trim(),
      fileUrl: cloudinaryUrl,
      cloudinaryPublicId,
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
    // Clean up Cloudinary file on unexpected error (only if it was already uploaded)
    if (cloudinaryPublicId) {
      try { await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw' }); } catch (e) {}
    }
    console.error('[Upload] Unexpected error:', error);
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
