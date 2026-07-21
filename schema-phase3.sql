



USE waste2worth;











CREATE TABLE IF NOT EXISTS WasteLogs (
  logId         INT AUTO_INCREMENT PRIMARY KEY,
  volunteerId   INT            NOT NULL,
  driveId       INT            NULL COMMENT 'FK to CleanupCampaigns; NULL if not tied to an organised drive',
  category      ENUM('Plastic','Metal','Paper','Glass','E-Waste','Textile','Organic','Other') NOT NULL,
  weightKg      DECIMAL(10,2)  NOT NULL,
  notes         TEXT           NULL,
  photoUrl      VARCHAR(255)   NULL,
  collectedAt   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  status        ENUM('Pending','Verified','Claimed') DEFAULT 'Pending',
  FOREIGN KEY (volunteerId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (driveId)     REFERENCES CleanupCampaigns(campaignId) ON DELETE SET NULL,
  INDEX idx_wastelogs_volunteer (volunteerId),
  INDEX idx_wastelogs_drive     (driveId),
  INDEX idx_wastelogs_category  (category),
  INDEX idx_wastelogs_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





CREATE TABLE IF NOT EXISTS WasteRequests (
  requestId     INT AUTO_INCREMENT PRIMARY KEY,
  requesterId   INT            NOT NULL,
  logId         INT            NOT NULL,
  quantityKg    DECIMAL(10,2)  NOT NULL,
  message       TEXT           NULL,
  status        ENUM('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  requestedAt   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requesterId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (logId)       REFERENCES WasteLogs(logId) ON DELETE CASCADE,
  INDEX idx_wastereq_requester (requesterId),
  INDEX idx_wastereq_log       (logId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
