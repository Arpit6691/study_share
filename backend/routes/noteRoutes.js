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
const { protect, canDownload } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getNotes)
  .post(protect, upload.single('file'), uploadNote);

router.get('/my-notes', protect, getMyNotes);
router.delete('/:id', protect, deleteNote);

router.get('/download/:id', protect, canDownload, downloadNote);
router.get('/preview/:id', protect, previewNote);
router.post('/rate/:id', protect, rateNote);
router.post('/report/:id', protect, reportNote);

module.exports = router;
