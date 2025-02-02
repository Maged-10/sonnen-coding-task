/**
 * @fileoverview Device-related routes (register, ping, configurations).
 * Includes validation and authentication for each endpoint.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const DeviceController = require('../controllers/DeviceController');

const router = express.Router();
const deviceController = new DeviceController();

/**
 * Validation middleware for MAC address format
 */
const validateMacAddress = body('macAddress')
  .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
  .withMessage('Invalid MAC address format');

/**
 * Register a new device with a MAC address.
 * Validates MAC address, registers device, and returns a token.
 */
router.post('/register', validateMacAddress, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const result = await deviceController.register(req.body.macAddress);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Ping a device to update the last contact timestamp.
 * Requires authentication.
 */
router.post('/ping', auth, async (req, res) => {
  try {
    const result = await deviceController.ping(req.device.serialNumber);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Update device configurations.
 * Requires authentication and validates configurations object.
 */
router.post('/configurations', auth, body('configurations').isObject(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const result = await deviceController.updateConfigurations(
      req.device.serialNumber,
      req.body.configurations
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
