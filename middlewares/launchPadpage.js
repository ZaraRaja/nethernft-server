const multer = require('multer');
const path = require('path');

const launchPage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, './LaunchpadPage');
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, 'congar' + '-' + Date.now() + path.extname(file.originalname));
  },
});

const launchUpload = multer({
  storage: launchPage,
});

module.exports = launchUpload.fields([{ name: 'launchCover', maxCount: 1 }]);
