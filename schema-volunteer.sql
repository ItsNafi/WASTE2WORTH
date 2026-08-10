-- ============================================================
-- WASTE2WORTH — Volunteer Registration System Schema
-- ============================================================

USE waste2worth;

CREATE TABLE IF NOT EXISTS VolunteerProfiles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  userId        INT NOT NULL UNIQUE,
  fullName      VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address       TEXT         NOT NULL,
  skills        TEXT,
  interests     TEXT,
  availability  ENUM('Weekdays','Weekends','Both','Flexible') DEFAULT 'Flexible',
  experience    TEXT,
  status        ENUM('Active','Inactive') DEFAULT 'Active',
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_volunteer_user   (userId),
  INDEX idx_volunteer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
