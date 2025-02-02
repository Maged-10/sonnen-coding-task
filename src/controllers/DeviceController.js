const jwt = require('jsonwebtoken');
const db = require('../db/init');

class DeviceController {
  generateSerialNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

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