const User = require('../model/User');
const bcrypt = require('bcryptjs');
const NftUser = require('../model/User');

/**
 * POST
 * Admin approve Influncer
 */

exports.approveInfluencer = async (req, res, next) => {
  try {
    const nftUser = await NftUser.findByIdAndUpdate(
      req.body.userId,
      { $set: { isInfluencer: true } },
      { new: true }
    );
    if (nftUser.isInfluencer) {
      res.status(200).send(nftUser);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * POST
 * Register a User
 */

exports.registerUser = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    const newUser = new User({
      username: username,
      email: email,
      password: hash,
    });

    const savedUser = await newUser.save();

    savedUser.password = undefined;

    res.status(200).json(savedUser);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * POST
 * Login a User
 */

exports.loginUser = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await User.findOne({ email: email });
    console.log(useremail);
    let originalText = bcrypt.compareSync(password, useremail.password);
    console.log(originalText);
    console.log(password);
    if (originalText) {
      res
        .status(200)
        .send({ message: 'user successfully login', useremail: useremail });
    } else {
      res.status(404).send({ message: 'password not matching' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Invalid Email' });
  }
};

/**
 * GET
 * Get All User
 */

exports.getAllUsers = async (req, res, next) => {
  try {
    const details = await User.find();
    console.log('Inside user api', details);
    res.status(200).send({ message: 'User get details successfully', details });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

/**
 * GET
 * Get one User
 */

exports.getOneUser = async (req, res, next) => {
  try {
    const details = await User.findOne({ _id: req.params.id });
    res.status(200).send(details);
  } catch (error) {
    res.status(500).send({ message: error });
  }
};
