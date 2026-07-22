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
