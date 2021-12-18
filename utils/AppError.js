class AppError extends Error {
  constructor(
    message,
    message_description,
    statusCode,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.message_description = message_description;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
