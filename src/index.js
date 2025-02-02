/**
 * @fileoverview Server setup for the application.
 * This file sets up an Express server with security middleware, routes, and error handling.
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Security middleware to protect the app.
 * - Helmet adds security headers to requests.
 * - CORS allows cross-origin requests.
 */
app.use(helmet());
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

/**
* Define routes for the API under /api
 */
app.use('/api', routes);

/**
 * Error handling middleware.
 */
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
