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

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
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
    
    const attachments = req.files.map(file => ({
      name: file.originalname,
      url: file.location, 
      size: file.size
    }));
    
    res.status(200).json({ attachments });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

module.exports = router;