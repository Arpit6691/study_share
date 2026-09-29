const multer = require('multer');
const path = require('path');

const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];

// Use memoryStorage so the file bytes are available in req.file.buffer
// The controller will upload to Cloudinary AFTER validation
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (allowedExtensions.includes(ext)) {
    return cb(null, true);
  } else {
    cb(new Error('Images and unsupported types are not allowed. Please upload Document files (PDF, DOC, DOCX, PPT, PPTX, TXT).'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
