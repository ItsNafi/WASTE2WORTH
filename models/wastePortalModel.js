const pool = require('../config/db');


const DriveModel = {
  
  async create({ title, location, date, participantCap, organizerId }) {
    const [result] = await pool.execute(
      `INSERT INTO CleanupCampaigns
         (organizerId, title, boundaryZone, location, date, participantCap)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [organizerId, title, location, location, date, participantCap]
    );
    return {
      driveId: result.insertId,
      organizerId,
      title,
      location,
      date,
      participantCap,
      status: 'Upcoming'
    };
  },

  
  async findAll(filter = 'all') {
    let where = '';
    if (filter === 'upcoming') {
      where = "WHERE c.status IN ('Upcoming', 'Active')";
    } else if (filter === 'past') {
      where = "WHERE c.status = 'Completed'";
    }

    const [rows] = await pool.execute(
      `SELECT c.*, u.name AS organizerName
       FROM CleanupCampaigns c
       LEFT JOIN Users u ON c.organizerId = u.id
       ${where}
       ORDER BY c.date ASC`
    );
    return rows;
  },

  
  async findById(campaignId) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.name AS organizerName
       FROM CleanupCampaigns c
       LEFT JOIN Users u ON c.organizerId = u.id
       WHERE c.campaignId = ?`,
      [campaignId]
    );
    return rows[0] || null;
  }
};


const WasteLogModel = {
  
  async create({ volunteerId, driveId, category, weightKg, notes, photoUrl }) {
    const [result] = await pool.execute(
      `INSERT INTO WasteLogs
         (volunteerId, driveId, category, weightKg, notes, photoUrl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [volunteerId, driveId || null, category, weightKg, notes || null, photoUrl || null]
    );
    return {
      logId: result.insertId,
      volunteerId,
      driveId: driveId || null,
      category,
      weightKg,
      notes,
      photoUrl,
      status: 'Pending'
    };
  },

  
  async findAll(filters = {}) {
    const conditions = [];
    const params     = [];

    if (filters.category) {
      conditions.push('wl.category = ?');
      params.push(filters.category);
    }
    if (filters.driveId) {
      conditions.push('wl.driveId = ?');
      params.push(filters.driveId);
    }
    if (filters.status) {
      conditions.push('wl.status = ?');
      params.push(filters.status);
    }
    if (filters.from) {
      conditions.push('wl.collectedAt >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('wl.collectedAt <= ?');
      params.push(filters.to);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT wl.*,
              u.name                       AS volunteerName,
              c.title                      AS driveName,
              COALESCE(c.location, c.boundaryZone) AS driveLocation
       FROM WasteLogs wl
       JOIN  Users           u ON wl.volunteerId = u.id
       LEFT JOIN CleanupCampaigns c ON wl.driveId = c.campaignId
       ${where}
       ORDER BY wl.collectedAt DESC`,
      params
    );
    return rows;
  },

  
  async findByVolunteer(volunteerId) {
    const [rows] = await pool.execute(
      `SELECT wl.*,
              COALESCE(c.title, 'Ad-hoc') AS driveName
       FROM WasteLogs wl
       LEFT JOIN CleanupCampaigns c ON wl.driveId = c.campaignId
       WHERE wl.volunteerId = ?
       ORDER BY wl.collectedAt DESC`,
      [volunteerId]
    );
    return rows;
  },

  
  async findById(logId) {
    const [rows] = await pool.execute(
      'SELECT * FROM WasteLogs WHERE logId = ?',
      [logId]
    );
    return rows[0] || null;
  },

  
  async updateStatus(logId, status) {
    await pool.execute(
      'UPDATE WasteLogs SET status = ? WHERE logId = ?',
      [status, logId]
    );
  }
};


const WasteRequestModel = {
  
  async create({ requesterId, logId, quantityKg, message }) {
    const [result] = await pool.execute(
      `INSERT INTO WasteRequests (requesterId, logId, quantityKg, message)
       VALUES (?, ?, ?, ?)`,
      [requesterId, logId, quantityKg, message || null]
    );
    return {
      requestId: result.insertId,
      requesterId,
      logId,
      quantityKg,
      message,
      status: 'Pending'
    };
  },

  
  async findByLog(logId) {
    const [rows] = await pool.execute(
      `SELECT wr.*, u.name AS requesterName
       FROM WasteRequests wr
       JOIN Users u ON wr.requesterId = u.id
       WHERE wr.logId = ?
       ORDER BY wr.requestedAt ASC`,
      [logId]
    );
    return rows;
  },

  
  async findByRequester(requesterId) {
    const [rows] = await pool.execute(
      `SELECT wr.*,
              wl.category    AS wasteCategory,
              wl.weightKg    AS totalWeightKg,
              u.name         AS volunteerName
       FROM WasteRequests wr
       JOIN WasteLogs wl ON wr.logId     = wl.logId
       JOIN Users     u  ON wl.volunteerId = u.id
       WHERE wr.requesterId = ?
       ORDER BY wr.requestedAt DESC`,
      [requesterId]
    );
    return rows;
  },

  
  async findById(requestId) {
    const [rows] = await pool.execute(
      `SELECT wr.*, wl.volunteerId, wl.status AS logStatus
       FROM WasteRequests wr
       JOIN WasteLogs wl ON wr.logId = wl.logId
       WHERE wr.requestId = ?`,
      [requestId]
    );
    return rows[0] || null;
  },

  
  async updateStatus(requestId, status) {
    await pool.execute(
      'UPDATE WasteRequests SET status = ? WHERE requestId = ?',
      [status, requestId]
    );
  },

  
  async hasPendingRequest(requesterId, logId) {
    const [rows] = await pool.execute(
      "SELECT requestId FROM WasteRequests WHERE requesterId = ? AND logId = ? AND status = 'Pending'",
      [requesterId, logId]
    );
    return rows.length > 0;
  },

  
  async findByVolunteerLogs(volunteerId) {
    const [rows] = await pool.execute(
      `SELECT wr.*,
              wl.category    AS wasteCategory,
              wl.weightKg    AS totalWeightKg,
              u.name         AS requesterName
       FROM WasteRequests wr
       JOIN WasteLogs wl ON wr.logId = wl.logId
       JOIN Users u ON wr.requesterId = u.id
       WHERE wl.volunteerId = ?
       ORDER BY wr.requestedAt DESC`,
      [volunteerId]
    );
    return rows;
  }
};

module.exports = { DriveModel, WasteLogModel, WasteRequestModel };
