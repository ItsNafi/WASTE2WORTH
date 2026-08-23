const crypto = require('crypto');
const pool = require('../config/db');

const createCertificateId = () =>
  `W2W-${new Date().getUTCFullYear()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

const CertificateModel = {
  async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT certificateRecordId, certificateId, userId, milestoneKey,
              milestoneTitle, threshold, greenPointsAtIssue, recipientName, issuedAt
       FROM EnvironmentalCertificates
       WHERE userId = ?
       ORDER BY threshold ASC`,
      [userId]
    );
    return rows;
  },

  async findByUserAndMilestone(userId, milestoneKey) {
    const [rows] = await pool.execute(
      `SELECT certificateRecordId, certificateId, userId, milestoneKey,
              milestoneTitle, threshold, greenPointsAtIssue, recipientName, issuedAt
       FROM EnvironmentalCertificates
       WHERE userId = ? AND milestoneKey = ?
       LIMIT 1`,
      [userId, milestoneKey]
    );
    return rows[0] || null;
  },

  async findOwnedByCertificateId(certificateId, userId) {
    const [rows] = await pool.execute(
      `SELECT certificateRecordId, certificateId, userId, milestoneKey,
              milestoneTitle, threshold, greenPointsAtIssue, recipientName, issuedAt
       FROM EnvironmentalCertificates
       WHERE certificateId = ? AND userId = ?
       LIMIT 1`,
      [certificateId, userId]
    );
    return rows[0] || null;
  },

  async findPublicByCertificateId(certificateId) {
    const [rows] = await pool.execute(
      `SELECT certificateId, milestoneTitle, threshold, greenPointsAtIssue,
              recipientName, issuedAt
       FROM EnvironmentalCertificates
       WHERE certificateId = ?
       LIMIT 1`,
      [certificateId]
    );
    return rows[0] || null;
  },

  async findOrCreate({
    userId,
    milestoneKey,
    milestoneTitle,
    threshold,
    greenPointsAtIssue,
    recipientName
  }) {
    const existing = await this.findByUserAndMilestone(userId, milestoneKey);
    if (existing) return { certificate: existing, created: false };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const certificateId = createCertificateId();

      try {
        await pool.execute(
          `INSERT INTO EnvironmentalCertificates
             (certificateId, userId, milestoneKey, milestoneTitle, threshold,
              greenPointsAtIssue, recipientName)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            certificateId,
            userId,
            milestoneKey,
            milestoneTitle,
            threshold,
            greenPointsAtIssue,
            recipientName
          ]
        );

        const certificate = await this.findByUserAndMilestone(userId, milestoneKey);
        return { certificate, created: true };
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;

        const concurrentlyCreated = await this.findByUserAndMilestone(userId, milestoneKey);
        if (concurrentlyCreated) {
          return { certificate: concurrentlyCreated, created: false };
        }
      }
    }

    throw new Error('Unable to allocate a unique certificate ID');
  }
};

module.exports = CertificateModel;
