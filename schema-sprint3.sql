-- ============================================================
-- WASTE2WORTH Database Migration — Sprint 3, Feature 10
-- Run this once on databases created before Feature 10.
-- ============================================================
USE waste2worth;

ALTER TABLE CleanupCampaigns
  ADD COLUMN description TEXT DEFAULT NULL AFTER title,
  ADD COLUMN startTime TIME DEFAULT NULL AFTER date,
  ADD COLUMN endTime TIME DEFAULT NULL AFTER startTime,
  ADD COLUMN organizerName VARCHAR(150) DEFAULT NULL AFTER currentVolunteers,
  ADD COLUMN imageUrl VARCHAR(255) DEFAULT NULL AFTER organizerName;

