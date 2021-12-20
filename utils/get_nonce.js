const { randomString, randomInRange } = require('make-random');

module.exports = async function getNonce() {
  return await randomString(await randomInRange(32, 64));
};
