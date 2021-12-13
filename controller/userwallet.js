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

    const oldUserWallet = await UserWallet.findOne({
      connectedAccount: req.body.connectedAccount,
    });

    if (oldUserWallet) {
      return res.status(200).send({
        status: 'success',
        message: 'Successfully connected metamask account',
        data: oldUserWallet,
      });
    }

    const newUserWallet = await services.add(UserWallet, req.body);
    res.status(200).send({
      status: 'success',
      message: 'Successfully added metamask account',
      data: newUserWallet,
    });
  } catch (e) {
    console.log('Error', e);
    res.status(500).send({
      status: 'error',
      error: e,
    });
  }
};
