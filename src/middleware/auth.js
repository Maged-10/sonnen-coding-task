/**
 * @fileoverview Middleware to authenticate API requests using JWT.
 * Verifies the token and attaches the decoded device information to the request object.
 */

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT.
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the decoded information to the request object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.device = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = auth;
