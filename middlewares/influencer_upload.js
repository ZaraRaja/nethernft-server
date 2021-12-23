const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/influencers',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
});

module.exports = upload.fields([{ name: 'cover_image', maxCount: 1 }]);
