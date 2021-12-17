/**
 * POST
 * Launchpad Api
 */

exports.launchpad = async (req, res, next) => {
  try {
    const Launchpage = new Launchpad({
      ...req.body,
      launchcover: req.files['launchCover'][0].path,
    });
    const savedLaunchpage = await Launchpage.save();
    res.status(200).json(savedLaunchpage);
  } catch (err) {
    console.log(err);
  }
};
