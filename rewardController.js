const CertificateModel = require('../models/certificateModel');
const UserModel = require('../models/userModel');
const PDFGenerator = require('../utils/pdfGenerator');
const {
  CERTIFICATE_MILESTONES,
  getAchievedMilestones,
  getMilestoneByKey
} = require('../utils/certificateMilestones');

const CERTIFICATE_ID_PATTERN = /^W2W-\d{4}-[A-F0-9]{12}$/;

const certificateDownloadUrl = (certificateId) =>
  `/api/rewards/certificates/${encodeURIComponent(certificateId)}/download`;

const certificateVerificationUrl = (certificateId) =>
  `/certificates/verify/${encodeURIComponent(certificateId)}`;

const toMilestoneResponse = (milestone, certificate, greenPoints) => {
  const earned = greenPoints >= milestone.threshold;
  const progress = Math.min(100, Math.floor((greenPoints / milestone.threshold) * 100));

  return {
    key: milestone.key,
    title: milestone.title,
    threshold: milestone.threshold,
    recognition: milestone.recognition,
    earned,
    remainingPoints: earned ? 0 : milestone.threshold - greenPoints,
    progress,
    certificate: certificate
      ? {
          certificateId: certificate.certificateId,
          issuedAt: certificate.issuedAt,
          downloadUrl: certificateDownloadUrl(certificate.certificateId),
          verificationUrl: certificateVerificationUrl(certificate.certificateId)
        }
      : null
  };
};

const loadEligibleUserAndMilestone = async (userId, milestoneKey) => {
  const milestone = getMilestoneByKey(milestoneKey);
  if (!milestone) {
    const error = new Error('Unknown environmental milestone');
    error.status = 404;
    throw error;
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const greenPoints = Math.max(0, Number(user.greenPoints) || 0);
  if (greenPoints < milestone.threshold) {
    const error = new Error(
      `${milestone.title} requires ${milestone.threshold} Green Points; ${milestone.threshold - greenPoints} more needed`
    );
    error.status = 403;
    throw error;
  }

  return { user, milestone, greenPoints };
};

const issueForMilestone = async (userId, milestoneKey) => {
  const { user, milestone, greenPoints } = await loadEligibleUserAndMilestone(userId, milestoneKey);
  const result = await CertificateModel.findOrCreate({
    userId: user.id,
    milestoneKey: milestone.key,
    milestoneTitle: milestone.title,
    threshold: milestone.threshold,
    greenPointsAtIssue: greenPoints,
    recipientName: user.name
  });

  return { ...result, milestone };
};

const sendControllerError = (res, err, fallbackMessage) => {
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: err.status ? err.message : fallbackMessage });
};

const logUnexpectedError = (context, err) => {
  if (!err.status || err.status >= 500) console.error(context, err);
};

const withVerificationUrl = (certificate) => {
  const configuredBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, '');
  const verificationPath = certificateVerificationUrl(certificate.certificateId);
  return {
    ...certificate,
    verificationUrl: configuredBaseUrl ? `${configuredBaseUrl}${verificationPath}` : verificationPath
  };
};

const RewardController = {
  async listMilestones(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const greenPoints = Math.max(0, Number(user.greenPoints) || 0);
      const certificates = await CertificateModel.findByUser(user.id);
      const certificatesByMilestone = new Map(
        certificates.map((certificate) => [certificate.milestoneKey, certificate])
      );

      res.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          greenPoints
        },
        milestones: CERTIFICATE_MILESTONES.map((milestone) =>
          toMilestoneResponse(
            milestone,
            certificatesByMilestone.get(milestone.key),
            greenPoints
          )
        )
      });
    } catch (err) {
      logUnexpectedError('List certificate milestones error:', err);
      sendControllerError(res, err, 'Failed to load environmental milestones');
    }
  },

  async issueCertificate(req, res) {
    try {
      const { certificate, created } = await issueForMilestone(
        req.user.id,
        req.params.milestoneKey
      );

      res.status(created ? 201 : 200).json({
        message: created ? 'Certificate issued successfully' : 'Certificate already issued',
        certificate: {
          certificateId: certificate.certificateId,
          milestoneKey: certificate.milestoneKey,
          milestoneTitle: certificate.milestoneTitle,
          greenPointsAtIssue: certificate.greenPointsAtIssue,
          issuedAt: certificate.issuedAt,
          downloadUrl: certificateDownloadUrl(certificate.certificateId),
          verificationUrl: certificateVerificationUrl(certificate.certificateId)
        }
      });
    } catch (err) {
      logUnexpectedError('Issue certificate error:', err);
      sendControllerError(res, err, 'Failed to issue environmental certificate');
    }
  },

  async downloadByCertificateId(req, res) {
    try {
      const { certificateId } = req.params;
      if (!CERTIFICATE_ID_PATTERN.test(certificateId)) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      const certificate = await CertificateModel.findOwnedByCertificateId(
        certificateId,
        req.user.id
      );
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      PDFGenerator.generateCertificate(res, withVerificationUrl(certificate));
    } catch (err) {
      logUnexpectedError('Download certificate error:', err);
      sendControllerError(res, err, 'Failed to generate certificate PDF');
    }
  },

  async downloadCertificate(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const achieved = getAchievedMilestones(user.greenPoints);
      const highestMilestone = achieved[achieved.length - 1];
      if (!highestMilestone) {
        return res.status(403).json({
          error: `A minimum of ${CERTIFICATE_MILESTONES[0].threshold} Green Points is required for a certificate`
        });
      }

      const { certificate } = await issueForMilestone(user.id, highestMilestone.key);
      PDFGenerator.generateCertificate(res, withVerificationUrl(certificate));
    } catch (err) {
      logUnexpectedError('Legacy certificate download error:', err);
      sendControllerError(res, err, 'Failed to generate certificate PDF');
    }
  },

  async verifyCertificate(req, res) {
    try {
      const { certificateId } = req.params;
      if (!CERTIFICATE_ID_PATTERN.test(certificateId)) {
        return res.status(404).json({ valid: false, error: 'Certificate not found' });
      }

      const certificate = await CertificateModel.findPublicByCertificateId(certificateId);
      if (!certificate) {
        return res.status(404).json({ valid: false, error: 'Certificate not found' });
      }

      res.json({
        valid: true,
        issuer: 'WASTE2WORTH',
        certificate: {
          certificateId: certificate.certificateId,
          recipientName: certificate.recipientName,
          milestoneTitle: certificate.milestoneTitle,
          threshold: certificate.threshold,
          greenPointsAtIssue: certificate.greenPointsAtIssue,
          issuedAt: certificate.issuedAt
        },
        statement:
          'This is a WASTE2WORTH environmental achievement certificate, not a legal or government certification.'
      });
    } catch (err) {
      logUnexpectedError('Verify certificate error:', err);
      sendControllerError(res, err, 'Failed to verify certificate');
    }
  }
};

module.exports = RewardController;
