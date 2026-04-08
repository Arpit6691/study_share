const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx|ppt|pptx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Some browsers send different mimetypes, so we mostly rely on extname for this test project
  // but it's good practice to check mimetype too if possible.
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Images and unsupported types are not allowed. Please upload Document files (PDF, DOC, DOCX, PPT, TXT).'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
