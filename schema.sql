-- ============================================================
-- WASTE2WORTH Database Schema — Phase 1
-- ============================================================

CREATE DATABASE IF NOT EXISTS waste2worth;
USE waste2worth;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL,
  email           VARCHAR(150)    NOT NULL UNIQUE,
  password        VARCHAR(255)    NOT NULL,
  role            ENUM('Citizen', 'Volunteer', 'BhangariShop', 'Creator', 'Admin')
                    DEFAULT 'Citizen',
  greenPoints     INT             DEFAULT 0,
  createdAt       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SCRAP LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ScrapListings (
  listingId       INT AUTO_INCREMENT PRIMARY KEY,
  ownerId         INT             NOT NULL,
  category        VARCHAR(100)    NOT NULL,
  weight          DECIMAL(10,2)   NOT NULL,
  status          ENUM('Available', 'Reserved', 'Sold')
                    DEFAULT 'Available',
  photoUrl        VARCHAR(255)    DEFAULT NULL,
  createdAt       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_scrap_status   (status),
  INDEX idx_scrap_owner    (ownerId),
  INDEX idx_scrap_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- UPCYCLED CRAFTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS UpcycledCrafts (
  craftId         INT AUTO_INCREMENT PRIMARY KEY,
  creatorId       INT             NOT NULL,
  title           VARCHAR(200)    NOT NULL,
  description     TEXT            DEFAULT NULL,
  price           DECIMAL(10,2)   NOT NULL,
  inventoryCount  INT             DEFAULT 1,
  beforePhotoUrl  VARCHAR(255)    DEFAULT NULL,
  afterPhotoUrl   VARCHAR(255)    DEFAULT NULL,
  storyNarrative  TEXT            DEFAULT NULL,
  createdAt       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_craft_creator (creatorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
