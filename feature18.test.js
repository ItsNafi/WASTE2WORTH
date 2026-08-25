const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'feature18-test-secret';

const pool = require('../config/db');
const HeatMapModel = require('../models/heatMapModel');
const ScrapModel = require('../models/scrapModel');
const PollutionModel = require('../models/pollutionModel');
const UserModel = require('../models/userModel');
const RewardEngine = require('../utils/rewardEngine');
const ScrapController = require('../controllers/scrapController');
const PollutionController = require('../controllers/pollutionController');
const { parseOptionalCoordinates } = require('../utils/coordinates');

const wasteRows = [
  { latitude: '23.81', longitude: '90.41', recordCount: 3 },
  { latitude: '22.36', longitude: '91.78', recordCount: 2 }
];
const complaintRows = [
  { latitude: '23.81', longitude: '90.41', recordCount: 4 },
  { latitude: '24.89', longitude: '91.87', recordCount: 1 }
];

const fakeExecute = async (sql) => {
  if (sql.includes('FROM ScrapListings') && sql.includes('GROUP BY')) return [wasteRows];
  if (sql.includes('FROM PollutionComplaints') && sql.includes('GROUP BY')) return [complaintRows];
  if (sql.includes('FROM ScrapListings')) return [[{ totalCount: 7, mappedCount: 5 }]];
  if (sql.includes('FROM PollutionComplaints')) return [[{ totalCount: 6, mappedCount: 5 }]];
  throw new Error(`Unexpected SQL in test: ${sql}`);
};

const startTestServer = async () => {
  const heatMapRoutes = require('../routes/heatMapRoutes');
  const app = express();
  app.use(cookieParser());
  app.use('/api/heat-map', heatMapRoutes);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  return server;
};

const closeServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
});

const makeResponse = () => {
  const state = { statusCode: 200, body: null };
  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    }
  };
};

const run = async () => {
  const originalExecute = pool.execute;
  const originalScrapCreate = ScrapModel.create;
  const originalPollutionCreate = PollutionModel.create;
  const originalUpdateGreenPoints = UserModel.updateGreenPoints;
  const originalAddPoints = RewardEngine.addPointsToUser;
  pool.execute = fakeExecute;
  let server;

  try {
    assert.deepEqual(parseOptionalCoordinates('', ''), { latitude: null, longitude: null });
    assert.deepEqual(
      parseOptionalCoordinates('23.8103314', '90.4125217'),
      { latitude: 23.810331, longitude: 90.412522 }
    );
    assert.throws(() => parseOptionalCoordinates('23.8', ''), /provided together/);
    assert.throws(() => parseOptionalCoordinates('91', '90'), /Latitude/);
    assert.throws(() => parseOptionalCoordinates('23', '-181'), /Longitude/);
    assert.throws(() => parseOptionalCoordinates('not-a-number', '90'), /Latitude/);

    let capturedScrap;
    ScrapModel.create = async (input) => {
      capturedScrap = input;
      return { listingId: 18, ...input, status: 'Available' };
    };
    UserModel.updateGreenPoints = async () => {};
    const legacyScrapResponse = makeResponse();
    await ScrapController.createListing(
      { body: { category: 'Plastic', weight: '2.5' }, user: { id: 9 } },
      legacyScrapResponse
    );
    assert.equal(legacyScrapResponse.state.statusCode, 201, 'legacy clients without coordinates still work');
    assert.equal(capturedScrap.latitude, null);
    assert.equal(capturedScrap.longitude, null);

    const invalidScrapResponse = makeResponse();
    await ScrapController.createListing(
      { body: { category: 'Plastic', weight: '2.5', latitude: '95', longitude: '90' }, user: { id: 9 } },
      invalidScrapResponse
    );
    assert.equal(invalidScrapResponse.state.statusCode, 400);

    let capturedComplaint;
    PollutionModel.create = async (input) => {
      capturedComplaint = input;
      return 19;
    };
    RewardEngine.addPointsToUser = async () => {};
    const complaintResponse = makeResponse();
    await PollutionController.submitComplaint(
      {
        body: {
          locationPin: 'Dhanmondi, Dhaka',
          description: 'Open dumping',
          latitude: '23.7465',
          longitude: '90.3760'
        },
        user: { id: 9 }
      },
      complaintResponse
    );
    assert.equal(complaintResponse.state.statusCode, 201);
    assert.equal(capturedComplaint.locationPin, 'Dhanmondi, Dhaka', 'existing complaint location is reused');
    assert.equal(capturedComplaint.latitude, 23.7465);
    assert.equal(capturedComplaint.longitude, 90.376);

    ScrapModel.create = originalScrapCreate;
    PollutionModel.create = originalPollutionCreate;
    UserModel.updateGreenPoints = originalUpdateGreenPoints;
    RewardEngine.addPointsToUser = originalAddPoints;

    const merged = HeatMapModel.mergeAreas(
      [...wasteRows, { latitude: 'invalid', longitude: '90', recordCount: 8 }],
      complaintRows
    );
    assert.equal(merged.length, 3, 'invalid rows should be ignored');
    assert.deepEqual(HeatMapModel.mergeAreas([], []), [], 'empty location data should be safe');
    assert.deepEqual(
      merged.find((area) => area.latitude === 23.81),
      { latitude: 23.81, longitude: 90.41, wasteCount: 3, complaintCount: 4, totalCount: 7 }
    );
    assert.equal(merged.find((area) => area.latitude === 22.36).complaintCount, 0, 'waste-only area');
    assert.equal(merged.find((area) => area.latitude === 24.89).wasteCount, 0, 'complaint-only area');

    const aggregate = await HeatMapModel.getAggregatedData();
    assert.equal(aggregate.summary.wasteListings.total, 7);
    assert.equal(aggregate.summary.wasteListings.mapped, 5);
    assert.equal(aggregate.summary.wasteListings.unmapped, 2);
    assert.equal(aggregate.summary.pollutionComplaints.total, 6);
    assert.equal(aggregate.summary.pollutionComplaints.unmapped, 1);
    assert.equal(aggregate.summary.mappedRecords, 10);
    assert.equal(aggregate.summary.unmappedRecords, 3);
    assert.equal(aggregate.areas.length, 3);

    pool.execute = async (sql) => sql.includes('GROUP BY')
      ? [[]]
      : [[{ totalCount: 0, mappedCount: 0 }]];
    const emptyAggregate = await HeatMapModel.getAggregatedData();
    assert.deepEqual(emptyAggregate.areas, []);
    assert.equal(emptyAggregate.summary.mappedRecords, 0);
    assert.equal(emptyAggregate.summary.unmappedRecords, 0);
    pool.execute = fakeExecute;

    server = await startTestServer();
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const anonymousResponse = await fetch(`${baseUrl}/api/heat-map`);
    assert.equal(anonymousResponse.status, 401, 'endpoint must require authentication');

    const token = jwt.sign({ id: 42, role: 'Citizen' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const response = await fetch(`${baseUrl}/api/heat-map`, {
      headers: { Cookie: `token=${token}` }
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const body = await response.json();
    assert.equal(body.areas.length, 3);
    assert.equal(body.areas[0].totalCount, 7);
    assert.equal(JSON.stringify(body).includes('citizenName'), false, 'aggregated API must not expose names');
    assert.equal(JSON.stringify(body).includes('ownerId'), false, 'aggregated API must not expose owner IDs');

    const view = fs.readFileSync(path.join(__dirname, '..', 'views', 'heatMap', 'index.html'), 'utf8');
    assert.match(view, /id="wasteHeatMap"/);
    assert.match(view, /id="toggleWasteLayer"/);
    assert.match(view, /id="toggleComplaintLayer"/);
    assert.match(view, /Heat intensity/);

    const migration = fs.readFileSync(path.join(__dirname, '..', 'schema-feature18.sql'), 'utf8');
    assert.match(migration, /ALTER TABLE ScrapListings/);
    assert.match(migration, /ALTER TABLE PollutionComplaints/);
    assert.doesNotMatch(migration, /CREATE TABLE/i, 'Feature 18 must reuse existing tables');

    console.log('Feature 18 tests passed: coordinates, aggregation, mixed/waste-only/complaint-only areas, invalid data, authentication, privacy, and UI contract.');
  } finally {
    if (server) await closeServer(server);
    pool.execute = originalExecute;
    ScrapModel.create = originalScrapCreate;
    PollutionModel.create = originalPollutionCreate;
    UserModel.updateGreenPoints = originalUpdateGreenPoints;
    RewardEngine.addPointsToUser = originalAddPoints;
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
