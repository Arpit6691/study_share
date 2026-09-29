const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const path = require('path');

const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    return {
      folder: 'study_share_uploads',
      resource_type: 'raw',           // required for non-image files (PDF, DOC, PPT, etc.)
      format: ext.replace('.', ''),   // preserve original extension
      public_id: `${file.fieldname}-${Date.now()}`,
      use_filename: false,
      unique_filename: true,
    };
  },
});

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
