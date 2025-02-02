/**
 * @fileoverview Initializes the SQLite database and creates necessary tables.
 * Sets up the connection to the database and defines the structure for devices and configurations.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Determines the database file path.
 * Uses an in-memory database for tests, otherwise, it loads from a persistent file.
 * @constant {string}
 */
const dbFile = path.join(__dirname, `moonbattery${process.env.NODE_ENV === 'test' ? '-test' : ''}.db`);

/**
 * Establishes a connection to the SQLite database.
 * @constant {sqlite3.Database}
 */
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error(err.message);
  else console.log(`Connected to ${process.env.NODE_ENV === 'test' ? 'in-memory test' : 'MoonBattery'} database`);
});

// Create tables if they do not exist
db.serialize(() => {
  /**
   * Creates the 'devices' table to store device information.
   * Includes fields for MAC address, serial number, last contact time, and creation timestamp.
   */
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mac_address TEXT UNIQUE NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      last_contact DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /**
   * Creates the 'configurations' table to store device-specific configurations.
   * Each entry is linked to a device through a foreign key.
   */
  db.run(`
    CREATE TABLE IF NOT EXISTS configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (id)
    )
  `);
});

module.exports = db;
