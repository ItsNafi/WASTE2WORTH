



USE waste2worth;





CREATE TABLE IF NOT EXISTS CreatorProfiles (
  creatorId     INT           NOT NULL PRIMARY KEY,
  bio           TEXT          NULL COMMENT 'Short bio / tagline shown on storefront',
  story         TEXT          NULL COMMENT 'Longer personal upcycling journey story',
  avatarUrl     VARCHAR(255)  NULL,
  updatedAt     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
