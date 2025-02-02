/**
 * @fileoverview Controller for handling device-related operations.
 * Provides methods for device registration, pinging, and configuration updates.
 */

const jwt = require('jsonwebtoken');
const db = require('../db/init');

/**
 * DeviceController class.
 * Provides methods for interacting with devices in the database, including
 * registering a device, pinging a device, and updating device configurations.
 */
class DeviceController {

  /**
   * Generates a random serial number for a device.
   * @returns {string} The generated serial number.
   */
  generateSerialNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Registers a new device in the database.
   * JWT Includes the device's serial number and device ID.
   * @param {string} macAddress - The MAC address of the device.
   * @returns {Promise<Object>} Resolves with the generated serial number and a JWT token.
   */
  async register(macAddress) {
    return new Promise((resolve, reject) => {
      const serialNumber = this.generateSerialNumber();

      db.run(
        'INSERT INTO devices (mac_address, serial_number) VALUES (?, ?)',
        [macAddress, serialNumber],
        function (err) {
          if (err) {
            reject(new Error('Device registration failed'));
            return;
          }

          const token = jwt.sign(
            { serialNumber, deviceId: this.lastID },
            process.env.JWT_SECRET,
            { expiresIn: '1y' }
          );

          resolve({ serialNumber, token });
        }
      );
    });
  }

  /**
   * Pings a device to update its last contact timestamp.
   * @param {string} serialNumber - The serial number of the device.
   * @returns {Promise<Object>} Resolves with a status message and updated last contact timestamp.
   */
  async ping(serialNumber) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE devices SET last_contact = CURRENT_TIMESTAMP WHERE serial_number = ?',
        [serialNumber],
        function (err) {
          if (err) {
            reject(new Error('Ping failed'));
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Device not found'));
            return;
          }
          resolve({
            status: 'ok',
            lastContact: new Date().toISOString()
          });
        }
      );
    });
  }

  /**
   * Updates the configurations of a device.
   * If a configuration key already exists for the device, it updates the value.
   * Otherwise, it inserts a new configuration entry.
   * @param {string} serialNumber - The serial number of the device.
   * @param {Object} configurations - The configurations to update (key-value pairs).
   * @returns {Promise<Object>} Resolves with a status message and a list of updated configuration keys.
   */
  async updateConfigurations(serialNumber, configurations) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM devices WHERE serial_number = ?',
        [serialNumber],
        async (err, device) => {
          if (err || !device) {
            reject(new Error('Device not found'));
            return;
          }

          const updates = Object.entries(configurations);
          const updatedKeys = [];

          try {
            // Begin transaction
            await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));

            for (const [key, value] of updates) {
              // Try to update first, then insert if no update was made
              await new Promise((res, rej) => {
                db.run(
                  `UPDATE configurations 
                   SET value = ? 
                   WHERE device_id = ? AND key = ?`,
                  [value, device.id, key],
                  function (err) {
                    if (err) {
                      rej(err);
                      return;
                    }
                    // If no row was updated, insert a new one
                    if (this.changes === 0) {
                      db.run(
                        `INSERT INTO configurations (device_id, key, value)
                         VALUES (?, ?, ?)`,
                        [device.id, key, value],
                        err => err ? rej(err) : res()
                      );
                    } else {
                      res();
                    }
                  }
                );
              });
              updatedKeys.push(key);
            }

            // Commit transaction
            await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));

            resolve({
              status: 'ok',
              updatedKeys
            });
          } catch (error) {
            // Rollback on error
            await new Promise(res => db.run('ROLLBACK', res));
            reject(new Error('Configuration update failed'));
          }
        }
      );
    });
  }
}

module.exports = DeviceController;
