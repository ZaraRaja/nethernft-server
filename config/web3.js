const Web3 = require('web3');

const rpc_url =
  process.env.NODE_ENV === 'production'
    ? 'https://bsc-dataseed.binance.org/'
    : 'https://data-seed-prebsc-1-s1.binance.org:8545/';

const web3 = new Web3(rpc_url);

module.exports = web3;
