-- ============================================================
-- WASTE2WORTH Database Migration - Feature 18
-- Interactive Geographical Waste Heat Map
-- ============================================================
USE waste2worth;

-- Coordinates stay on the existing domain records. They are nullable so
-- historical listings and complaints continue to work without fabricated data.
ALTER TABLE ScrapListings
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6) NULL AFTER photoUrl,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6) NULL AFTER latitude;

ALTER TABLE PollutionComplaints
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6) NULL AFTER locationPin,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6) NULL AFTER latitude;

-- Reuse legacy complaint locations when they were already stored as a plain
-- "latitude, longitude" pair. Human-readable addresses remain unchanged.
UPDATE PollutionComplaints
SET latitude = CAST(TRIM(SUBSTRING_INDEX(locationPin, ',', 1)) AS DECIMAL(9,6)),
    longitude = CAST(TRIM(SUBSTRING_INDEX(locationPin, ',', -1)) AS DECIMAL(10,6))
WHERE latitude IS NULL
  AND longitude IS NULL
  AND locationPin REGEXP '^[[:space:]]*[-+]?[0-9]+([.][0-9]+)?[[:space:]]*,[[:space:]]*[-+]?[0-9]+([.][0-9]+)?[[:space:]]*$'
  AND CAST(TRIM(SUBSTRING_INDEX(locationPin, ',', 1)) AS DECIMAL(9,6)) BETWEEN -90 AND 90
  AND CAST(TRIM(SUBSTRING_INDEX(locationPin, ',', -1)) AS DECIMAL(10,6)) BETWEEN -180 AND 180;

-- Add covering coordinate indexes only when they do not already exist.
SET @feature18_scrap_index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'ScrapListings'
    AND index_name = 'idx_scrap_geo'
);
SET @feature18_scrap_index_sql = IF(
  @feature18_scrap_index_exists = 0,
  'ALTER TABLE ScrapListings ADD INDEX idx_scrap_geo (latitude, longitude)',
  'SELECT 1'
);
PREPARE feature18_scrap_index_stmt FROM @feature18_scrap_index_sql;
EXECUTE feature18_scrap_index_stmt;
DEALLOCATE PREPARE feature18_scrap_index_stmt;

SET @feature18_pollution_index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'PollutionComplaints'
    AND index_name = 'idx_pollution_geo'
);
SET @feature18_pollution_index_sql = IF(
  @feature18_pollution_index_exists = 0,
  'ALTER TABLE PollutionComplaints ADD INDEX idx_pollution_geo (latitude, longitude)',
  'SELECT 1'
);
PREPARE feature18_pollution_index_stmt FROM @feature18_pollution_index_sql;
EXECUTE feature18_pollution_index_stmt;
DEALLOCATE PREPARE feature18_pollution_index_stmt;
