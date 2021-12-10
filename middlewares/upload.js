const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  //       destination: (req, res, cb) => {
  //     cb(null, "./IpfsUploads");
  //   },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, 'congar' + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
});

module.exports = upload.single('Savedlife');
