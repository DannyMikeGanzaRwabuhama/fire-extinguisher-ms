const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle postgres unique/foreign key constraint violations
  if (err.code === '23505') {
    status = 409;
    message = 'Conflict: A duplicate entry already exists.';
    if (err.detail) {
      message += ` Detail: ${err.detail}`;
    }
  } else if (err.code === '23503') {
    status = 400;
    message = 'Bad Request: Reference error (foreign key constraint).';
    if (err.detail) {
      message += ` Detail: ${err.detail}`;
    }
  }

  // Print error to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error handled:', err);
  }

  res.status(status).json({
    status,
    message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
