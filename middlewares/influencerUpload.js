const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, './influencerUploads');
  },
  filename: (req, file, cb) => {
    console.log('UploadedImage', file);
    cb(null, `${'congar -'}${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
});
module.exports = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 8 },
]);
