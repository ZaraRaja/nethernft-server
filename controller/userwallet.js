const _ = require('lodash');
const services = require('../Services/Crud');
const UserWallet = require('../model/UserWallet');

/**
 * POST
 * Storing User Wallet Address
 */

exports.userWalletAccount = async (req, res, next) => {
  try {
    console.log('Req.body', req.body);
    const result_list = await services.add(UserWallet, req.body);
    res.status(200).send({
      success: true,
      message: 'Successfully added metamask account',
      data: result_list,
    });
  } catch (e) {
    console.log('Error', e);
  }
};

