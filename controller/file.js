const File = require('../model/File');
const services = require('../Services/Crud');

/**
 * GET
 * Getting hash of a file
 */
exports.getHashedOfFiles = async (req, res, next) => {
  try {
    console.log('Inside method', req.body);

    const _list = await services.getList(File, {}, {});
    res.send({ success: true, data: _list });
    console.log('List data', _list);
  } catch (err) {
    res.status(500).json(err);
  }
};

/**
 * POST
 * Adding New Files
 */
exports.addFiles = async (req, res, next) => {
  try {
    const filepath = req.file.path;
    console.log(filepath);
    const hash = req.body.hash;
    const UserFile = new File({
      filepath: filepath,
      hash: hash,
    });

    const savedFile = await UserFile.save();
    res.status(200).json(savedFile);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
