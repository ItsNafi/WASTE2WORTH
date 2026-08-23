-- ============================================================
-- WASTE2WORTH Database Migration - Feature 15
-- Automated Environmental Certification
-- ============================================================
USE waste2worth;

CREATE TABLE IF NOT EXISTS EnvironmentalCertificates (
  certificateRecordId BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  certificateId       VARCHAR(32)  NOT NULL,
  userId              INT          NOT NULL,
  milestoneKey        VARCHAR(64)  NOT NULL,
  milestoneTitle      VARCHAR(150) NOT NULL,
  threshold           INT          NOT NULL,
  greenPointsAtIssue  INT          NOT NULL,
  recipientName       VARCHAR(100) NOT NULL,
  issuedAt            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_environmental_certificates_user
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_environmental_certificate_id (certificateId),
  UNIQUE KEY uq_environmental_certificate_user_milestone (userId, milestoneKey),
  INDEX idx_environmental_certificates_user (userId),
  INDEX idx_environmental_certificates_issued_at (issuedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
