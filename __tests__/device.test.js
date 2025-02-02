const request = require('supertest');
const app = require('../src/index').app;
const server = require('../src/index').server;
const db = require('../src/db/init');

describe('Test MoonBattery API', () => {
  let testToken;
  const testMacAddress = '00:11:22:33:44:55';

  afterAll(() => {
    // Clean up
    db.close();
    server.close();
  });

  describe('POST /api/register', () => {
    it('Test register a device with valid MAC address', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ macAddress: testMacAddress });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('serialNumber');
      expect(response.body).toHaveProperty('token');

      // Store JWT token for future requests
      testToken = response.body.token;

      // Verify database entry
      const device = await new Promise((resolve) => {
        db.get(
          'SELECT * FROM devices WHERE mac_address = ?',
          [testMacAddress],
          (err, row) => resolve(row)
        );
      });
      expect(device).toBeTruthy();
      expect(device.mac_address).toBe(testMacAddress);
    });

    it('Test reject invalid MAC address', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ macAddress: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ping', () => {
    it('Test update last_contact for authenticated device', async () => {
      const response = await request(app)
        .post('/api/ping')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.lastContact).toBeTruthy();

      // Verify database update
      const device = await new Promise((resolve) => {
        db.get(
          'SELECT last_contact FROM devices WHERE mac_address = ?',
          [testMacAddress],
          (err, row) => resolve(row)
        );
      });
      expect(device.last_contact).toBeTruthy();
    });

    it('Test reject request without auth token', async () => {
      const response = await request(app)
        .post('/api/ping');

      expect(response.status).toBe(401);
    });

    it('Test reject request with invalid auth token', async () => {
      const response = await request(app)
        .post('/api/ping')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/configurations', () => {
    let deviceId;

    beforeEach(async () => {
      // Get device ID from database
      deviceId = await new Promise((resolve) => {
        db.get(
          'SELECT id FROM devices WHERE mac_address = ?',
          [testMacAddress],
          (err, row) => resolve(row.id)
        );
      });
    });

    it('Test store new configurations for authenticated device', async () => {
      const testConfigs = {
        configurations: {
          chargingRate: '1.5',
          maxCapacity: '10000'
        }
      };

      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${testToken}`)
        .send(testConfigs);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.updatedKeys).toHaveLength(2);

      // Verify database entries
      const configs = await new Promise((resolve) => {
        db.all(
          'SELECT key, value FROM configurations WHERE device_id = ?',
          [deviceId],
          (err, rows) => resolve(rows)
        );
      });
      expect(configs).toHaveLength(2);
      expect(configs.map(c => c.key)).toEqual(
        expect.arrayContaining(Object.keys(testConfigs.configurations))
      );
    });

    it('Test update existing configurations', async () => {
      // Some Initial configuration
      await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          configurations: {
            chargingRate: '1.5'
          }
        });

      // Update configuration
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          configurations: {
            chargingRate: '2.0'
          }
        });

      expect(response.status).toBe(200);

      // Verify updated value in database
      const config = await new Promise((resolve) => {
        db.get(
          'SELECT value FROM configurations WHERE device_id = ? AND key = ?',
          [deviceId, 'chargingRate'],
          (err, row) => resolve(row)
        );
      });
      expect(config.value).toBe('2.0');
    });

    it('Test reject request without auth token', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .send({
          configurations: {
            chargingRate: '1.5'
          }
        });

      expect(response.status).toBe(401);
    });

    it('Test reject invalid configuration format', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          configurations: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });
});
