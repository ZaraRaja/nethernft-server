const web3 = require('../config/web3');
const ntrContract = require('../config/ntr_contract');
const ntrContractAddress = process.env.NTR_CONTRACT_ADDRESS;

async function sendNTR(ntr_amount, to) {
  const sender = process.env.ADMIN_ACCOUNT_FOR_BNB_FEE;
  let chainId = 97;
  if (process.env.NODE_ENV === 'production') {
    chainId = 56;
  }

  var count = await web3.eth.getTransactionCount(`${sender}`);

  let value = web3.utils.toWei(`${ntr_amount}`, 'ether');

  let gasLimit = '';
  try {
    gasLimit = await web3.eth.estimateGas({
      from: `${sender}`,
      nonce: web3.utils.toHex(count),
      to: `${ntrContractAddress}`,
      data: ntrContract.methods.transfer(`${to}`, value).encodeABI(),
      chainId: web3.utils.toHex(chainId),
    });
  } catch (error) {
    throw error;
  }

  var trxObj = {
    from: `${sender}`,
    nonce: web3.utils.toHex(count),
    gasPrice: '0x00000002540BE400',
    gasLimit: gasLimit,
    to: `${ntrContractAddress}`,
    value: '0x0',
    data: ntrContract.methods.transfer(`${to}`, value).encodeABI(),
    chainId: chainId,
    common: {
      customChain: {
        chainId,
        networkId: chainId,
      },
    },
  };

  // Sign Transaction
  const rawTransaction = (
    await web3.eth.accounts.signTransaction(
      trxObj,
      process.env.ADMIN_ACCOUNT_FOR_BNB_FEE_PRIVATE_KEY
    )
  ).rawTransaction;

  try {
    return await web3.eth.sendSignedTransaction(rawTransaction);
  } catch (error) {
    throw error;
  }
}

async function sendBNB(bnb_amount, to) {
  const sender = process.env.ADMIN_ACCOUNT_FOR_BNB_FEE;
  let chainId = 97;
  if (process.env.NODE_ENV === 'production') {
    chainId = 56;
  }

  var count = await web3.eth.getTransactionCount(`${sender}`);

  let value = web3.utils.toWei(`${bnb_amount}`, 'ether');

  let gasLimit = '';
  try {
    gasLimit = await web3.eth.estimateGas({
      from: `${sender}`,
      nonce: web3.utils.toHex(count),
      to: `${to}`,
      value: web3.utils.toHex(value),
      chainId: web3.utils.toHex(chainId),
    });
  } catch (error) {
    throw error;
  }

  var trxObj = {
    from: `${sender}`,
    nonce: web3.utils.toHex(count),
    gasPrice: '0x00000002540BE400',
    gasLimit: gasLimit,
    to: `${to}`,
    value: web3.utils.toHex(value),
    chainId: chainId,
    common: {
      customChain: {
        chainId,
        networkId: chainId,
      },
    },
  };

  // Sign Transaction
  const rawTransaction = (
    await web3.eth.accounts.signTransaction(
      trxObj,
      process.env.ADMIN_ACCOUNT_FOR_BNB_FEE_PRIVATE_KEY
    )
  ).rawTransaction;

  try {
    return await web3.eth.sendSignedTransaction(rawTransaction);
  } catch (error) {
    throw error;
  }
}

exports.sendNTR = sendNTR;
exports.sendBNB = sendBNB;
