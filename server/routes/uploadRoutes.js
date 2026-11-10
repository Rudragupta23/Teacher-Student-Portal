const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { protect } = require('../middlewares/authMiddleware');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Word & HTML files can't be detected reliably by AUTO_CONTENT_TYPE
// (.docx is stored as "application/zip" and .html as "application/octet-stream"),
// so set their Content-Type from the file extension instead.
const WORD_TYPES = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword'
};

const setContentType = (req, file, cb) => {
  const name = (file.originalname || '').toLowerCase();
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';

  if (WORD_TYPES[ext]) return cb(null, WORD_TYPES[ext]);

  if (ext === '.html' || ext === '.htm') {
    // Only admins/graders can publish HTML that opens as a web page.
    // From anyone else it is stored as a plain download.
    const canPublishHtml = req.user && (req.user.role === 'admin' || req.user.role === 'grader');
    return cb(null, canPublishHtml ? 'text/html; charset=utf-8' : 'application/octet-stream');
  }

  // Everything else (PDF, PNG, JPG...) keeps the existing auto-detection
  return multerS3.AUTO_CONTENT_TYPE(req, file, cb);
};

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: setContentType,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = req.query.folder ? req.query.folder.trim() : 'misc';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${folder}/${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

router.post('/', protect, upload.array('files', 30), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const attachments = req.files.map(file => {
      // Use CloudFront URL if available, otherwise fallback to standard S3 URL
      const finalUrl = process.env.AWS_CLOUDFRONT_URL 
        ? `${process.env.AWS_CLOUDFRONT_URL}/${file.key}`
        : file.location;

      return {
        name: file.originalname,
        url: finalUrl, 
        size: file.size
      };
    });
    
    res.status(200).json({ attachments });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

module.exports = router;