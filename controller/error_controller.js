const responseMessages = require('../config/response_messages');
const AppError = require('../utils/AppError');

const sendErrorDev = (err, req, res) => {
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      message_description: err.message_description,
    });
  }
  // Programming or other unknown error
  // 1) Log error
  console.error('ERROR 💥: ', err);

  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: responseMessages.SERVER_ERROR,
    message_description: 'Something went very wrong!',
  });
};

//  Cast errors signify that the input was in the wrong format.
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(responseMessages.DB_CAST_ERROR, message, 400);
};
// handle duplicate field errors
const handleDuplicateFieldsDB = (err) => {
  // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const field = err.errmsg.match(/{ (.*):/)[1];
  const value = err.errmsg.match(/{ (.*): (.*) /)[2];
  const message = `Duplicate field ${field}: ${value}. Please use another value!`;
  return new AppError(responseMessages.DB_DUPLICATE_FIELDS, message, 400);
};

// handle validation
const handleValidationErrorDB = (err) => {
  console.log(err.errors);
  const errors = Object.values(err.errors).map((el, i) => {
    if (i < Object.values(err.errors).length - 1) {
      return el.message;
    }
  });
  const message = `${errors.join('. ')}`;
  return new AppError(responseMessages.DB_VALIDATION_ERROR, message, 400);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    sendErrorProd(err, req, res);
  }
};
