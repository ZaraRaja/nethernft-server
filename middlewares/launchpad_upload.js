const multer = require('multer');
const path = require('path');

const diskStorage = multer.diskStorage({
  destination: './uploads/launchpad',
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const launchpadUpload = multer({
  storage: diskStorage,
});

module.exports = launchpadUpload.fields([
  { name: 'launchpad_cover', maxCount: 1 },
]);
