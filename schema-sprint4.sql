USE waste2worth;

-- Feature 19: Crowdsourced Complaint Box System
CREATE TABLE IF NOT EXISTS PollutionComplaints (
  complaintId INT AUTO_INCREMENT PRIMARY KEY,
  citizenId INT NOT NULL,
  locationPin VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  photoUrl VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Reviewed', 'Resolved') NOT NULL DEFAULT 'Pending',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citizenId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safely migrate the Phase 2 status names without losing existing complaints.
ALTER TABLE PollutionComplaints
  MODIFY status ENUM(
    'Reported', 'Investigating', 'Pending', 'Reviewed', 'Resolved'
  ) NOT NULL DEFAULT 'Pending';

UPDATE PollutionComplaints SET status = 'Pending' WHERE status = 'Reported';
UPDATE PollutionComplaints SET status = 'Reviewed' WHERE status = 'Investigating';

ALTER TABLE PollutionComplaints
  MODIFY status ENUM('Pending', 'Reviewed', 'Resolved') NOT NULL DEFAULT 'Pending';
