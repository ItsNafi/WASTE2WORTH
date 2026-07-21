-- ============================================================
-- WASTE2WORTH Database Schema — Phase 2
-- ============================================================
USE waste2worth;

-- Add craft category field so storefront filtering can work by category
ALTER TABLE UpcycledCrafts
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL;

-- Backfill legacy crafts created before category tracking was fixed
UPDATE UpcycledCrafts SET category = 'Fashion' WHERE craftId = 106 AND category IS NULL;
UPDATE UpcycledCrafts SET category = 'Accessories' WHERE craftId = 107 AND category IS NULL;
UPDATE UpcycledCrafts SET category = 'Home Decor' WHERE craftId = 108 AND category IS NULL;

-- ============================================================
-- CLEANUP CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS CleanupCampaigns (
  campaignId        INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200)    NOT NULL,
  date              DATE            NOT NULL,
  boundaryZone      VARCHAR(255)    NOT NULL,
  participantCap    INT             NOT NULL,
  currentVolunteers INT             DEFAULT 0,
  status            ENUM('Upcoming', 'Active', 'Completed') DEFAULT 'Upcoming',
  createdAt         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CAMPAIGN REGISTRATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS CampaignRegistrations (
  registrationId    INT AUTO_INCREMENT PRIMARY KEY,
  campaignId        INT             NOT NULL,
  volunteerId       INT             NOT NULL,
  status            ENUM('Registered', 'Attended') DEFAULT 'Registered',
  wasteCollectedKg  DECIMAL(10,2)   DEFAULT 0.00,
  registeredAt      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaignId) REFERENCES CleanupCampaigns(campaignId) ON DELETE CASCADE,
  FOREIGN KEY (volunteerId) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (campaignId, volunteerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- POLLUTION COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS PollutionComplaints (
  complaintId       INT AUTO_INCREMENT PRIMARY KEY,
  citizenId         INT             NOT NULL,
  locationPin       VARCHAR(255)    NOT NULL,
  description       TEXT            NOT NULL,
  photoUrl          VARCHAR(255)    DEFAULT NULL,
  status            ENUM('Reported', 'Investigating', 'Resolved') DEFAULT 'Reported',
  createdAt         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizenId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRICE DIRECTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS PriceDirectory (
  categoryId        INT AUTO_INCREMENT PRIMARY KEY,
  categoryName      VARCHAR(100)    NOT NULL UNIQUE,
  pricePerKg        DECIMAL(10,2)   NOT NULL,
  updatedAt         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default prices
INSERT IGNORE INTO PriceDirectory (categoryName, pricePerKg) VALUES 
('Plastic', 5.00),
('Metal', 15.00),
('Paper', 2.00),
('Glass', 3.00),
('E-Waste', 25.00),
('Textile', 4.00),
('Organic', 1.00),
('Other', 0.50);

-- ============================================================
-- RECYCLING HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS RecyclingHistory (
  historyId    INT AUTO_INCREMENT PRIMARY KEY,
  creatorId    INT             NOT NULL,
  craftId      INT             DEFAULT NULL,
  eventDate    DATE            NOT NULL,
  recycledKg   DECIMAL(10,2)   DEFAULT 0.00,
  materials    VARCHAR(255)    DEFAULT NULL,
  description  TEXT            DEFAULT NULL,
  createdAt    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (craftId) REFERENCES UpcycledCrafts(craftId) ON DELETE SET NULL,
  INDEX idx_recycling_creator (creatorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
