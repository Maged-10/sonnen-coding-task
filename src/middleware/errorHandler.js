/**
 * @fileoverview Error handling middleware for the application.
 * Catches and handles errors in the app, logging the error stack and sending a response.
 */

/**
 * Middleware to handle errors.
 * Logs the error stack and returns a 500 Internal Server Error response.
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
