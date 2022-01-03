const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('../utils/catch_async');
const s3 = require('../config/s3');
const responseMessages = require('../config/response_messages');

const randomBytes = promisify(crypto.randomBytes);

exports.getS3UploadUrl = catchAsync(async (req, res, next) => {
  const filename = (await randomBytes(32)).toString('hex');

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Expires: 60,
  };

  const uploadURL = await s3.getSignedUrlPromise('putObject', params);

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'S3 Bucket Upload URL',
    uploadURL,
  });
});
