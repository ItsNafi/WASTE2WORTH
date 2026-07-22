const pool = require('../config/db');

const CampaignModel = {
  async create({ title, date, boundaryZone, participantCap }) {
    const [result] = await pool.execute(
      'INSERT INTO CleanupCampaigns (title, date, boundaryZone, participantCap) VALUES (?, ?, ?, ?)',
      [title, date, boundaryZone, participantCap]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM CleanupCampaigns ORDER BY date DESC');
    return rows;
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
  },

  async findRegistrationById(registrationId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, cc.title AS campaignTitle 
       FROM CampaignRegistrations cr
       JOIN CleanupCampaigns cc ON cr.campaignId = cc.campaignId
       WHERE cr.registrationId = ?`,
      [registrationId]
    );
    return rows[0] || null;
  },

  async findAttendedRegistrations() {
    const [rows] = await pool.execute(
      `SELECT cr.*, cc.title AS campaignTitle, u.name AS volunteerName 
       FROM CampaignRegistrations cr
       JOIN CleanupCampaigns cc ON cr.campaignId = cc.campaignId
       JOIN Users u ON cr.volunteerId = u.id
       WHERE cr.status = 'Attended'
       ORDER BY cr.registeredAt DESC`
    );
    return rows;
  }
};

module.exports = CampaignModel;
