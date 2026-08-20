-- ============================================================
-- WASTE2WORTH Database Schema — Phase 3
-- ============================================================
USE waste2worth;

-- ============================================================
-- CREATOR REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS CreatorReviews (
  reviewId       INT AUTO_INCREMENT PRIMARY KEY,
  creatorId      INT             NOT NULL,
  customerId     INT             NOT NULL,
  rating         INT             NOT NULL,
  reviewText     TEXT            DEFAULT NULL,
  createdAt      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Payments (
  paymentId      INT AUTO_INCREMENT PRIMARY KEY,
  senderId       INT             NOT NULL,
  receiverId     INT             DEFAULT NULL, -- NULL if Centralized Cleanup Campaign Fund
  amount         DECIMAL(10,2)   NOT NULL,
  type           ENUM('BhangariToCitizen', 'BhangariToVolunteer', 'CustomerCheckout') NOT NULL,
  referenceId    INT             NOT NULL, -- scrapId, campaignRegistrationId, or craftId
  status         ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed',
  createdAt      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Notifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  userId         INT             NOT NULL,
  message        TEXT            NOT NULL,
  isRead         BOOLEAN         DEFAULT FALSE,
  createdAt      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CAMPAIGN ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_attendance (
  attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id     INT             NOT NULL,
  volunteer_id    INT             NOT NULL,
  scanned_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  points_awarded  INT             DEFAULT 0,
  FOREIGN KEY (campaign_id) REFERENCES CleanupCampaigns(campaignId) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (campaign_id, volunteer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GREEN SCORE LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS green_score_logs (
  log_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT             NOT NULL,
  points_earned   INT             NOT NULL,
  activity_type   VARCHAR(100)    NOT NULL,
  reference_id    INT             DEFAULT NULL,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
