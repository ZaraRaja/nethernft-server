const catchAsync = require('../utils/catch_async');

/**
 * POST
 * Launchpad Api
 */

exports.create = catchAsync(async (req, res, next) => {
  const Launchpage = new Launchpad({
    ...req.body,
    launchcover: req.files['launchpad_cover'][0].path,
  });

  const savedLaunchpage = await Launchpage.save();

  // TODO: Update response according to standard
  res.status(200).json(savedLaunchpage);
});
