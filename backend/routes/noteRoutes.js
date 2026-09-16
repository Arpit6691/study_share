const express = require('express');
const router = express.Router();
const { 
  uploadNote, 
  getNotes, 
  downloadNote, 
  previewNote, 
  rateNote, 
  reportNote, 
  getMyNotes, 
  deleteNote 
} = require('../controllers/noteController');
const multer = require('multer');
const { protect, canDownload } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Custom multer error handler middleware
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large! Maximum allowed size is 10MB.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

router.route('/')
  .get(protect, getNotes)
  .post(protect, handleUpload, uploadNote);

router.get('/my-notes', protect, getMyNotes);
router.delete('/:id', protect, deleteNote);

router.get('/download/:id', protect, canDownload, downloadNote);
router.get('/preview/:id', protect, previewNote);
router.post('/rate/:id', protect, rateNote);
router.post('/report/:id', protect, reportNote);

module.exports = router;
