const pool = require('../config/db');

const CampaignModel = {
  async create({
    title,
    description,
    date,
    startTime,
    endTime,
    boundaryZone,
    participantCap,
    organizerName,
    imageUrl,
    status
  }) {
    const [result] = await pool.execute(
      `INSERT INTO CleanupCampaigns
        (title, description, date, startTime, endTime, boundaryZone,
         participantCap, organizerName, imageUrl, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        date,
        startTime,
        endTime,
        boundaryZone,
        participantCap,
        organizerName,
        imageUrl,
        status
      ]
    );
    return result.insertId;
  },

  async findAll({ search = '', status = '' } = {}) {
    const conditions = [];
    const values = [];

    if (search) {
      conditions.push('(title LIKE ? OR boundaryZone LIKE ?)');
      const term = `%${search}%`;
      values.push(term, term);
    }

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT * FROM CleanupCampaigns${where} ORDER BY date DESC, startTime ASC`,
      values
    );
    return rows;
  },

  async findById(campaignId) {
    const [rows] = await pool.execute(
      'SELECT * FROM CleanupCampaigns WHERE campaignId = ?',
      [campaignId]
    );
    return rows[0] || null;
  },

  async update(campaignId, {
    title,
    description,
    date,
    startTime,
    endTime,
    boundaryZone,
    participantCap,
    organizerName,
    imageUrl,
    status
  }) {
    const [result] = await pool.execute(
      `UPDATE CleanupCampaigns
       SET title = ?, description = ?, date = ?, startTime = ?, endTime = ?,
           boundaryZone = ?, participantCap = ?, organizerName = ?, imageUrl = ?, status = ?
       WHERE campaignId = ?`,
      [
        title,
        description,
        date,
        startTime,
        endTime,
        boundaryZone,
        participantCap,
        organizerName,
        imageUrl,
        status,
        campaignId
      ]
    );
    return result.affectedRows;
  },

  async delete(campaignId) {
    const [result] = await pool.execute(
      'DELETE FROM CleanupCampaigns WHERE campaignId = ?',
      [campaignId]
    );
    return result.affectedRows;
  },

  async findActiveAndUpcoming() {
    const [rows] = await pool.execute("SELECT * FROM CleanupCampaigns WHERE status IN ('Upcoming', 'Active') ORDER BY date ASC");
    return rows;
  },

  async registerVolunteer(campaignId, volunteerId) {
    await pool.execute(
      'INSERT INTO CampaignRegistrations (campaignId, volunteerId) VALUES (?, ?)',
      [campaignId, volunteerId]
    );
    await pool.execute('UPDATE CleanupCampaigns SET currentVolunteers = currentVolunteers + 1 WHERE campaignId = ?', [campaignId]);
  },

  async checkRegistration(campaignId, volunteerId) {
    const [rows] = await pool.execute(
      'SELECT * FROM CampaignRegistrations WHERE campaignId = ? AND volunteerId = ?',
      [campaignId, volunteerId]
    );
    return rows.length > 0;
  },

  async logAttendanceAndWaste(campaignId, volunteerId, wasteCollectedKg) {
    await pool.execute(
      "UPDATE CampaignRegistrations SET status = 'Attended', wasteCollectedKg = ? WHERE campaignId = ? AND volunteerId = ?",
      [wasteCollectedKg, campaignId, volunteerId]
    );
  }
};

module.exports = CampaignModel;
