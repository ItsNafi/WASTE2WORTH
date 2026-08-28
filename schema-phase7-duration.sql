-- 1. Add durationHours to CleanupCampaigns
ALTER TABLE CleanupCampaigns 
ADD COLUMN durationHours DECIMAL(4,2) DEFAULT 3.00;

-- 2. Add hoursAttended to campaign_attendance
ALTER TABLE campaign_attendance 
ADD COLUMN hoursAttended DECIMAL(4,2) NULL;
