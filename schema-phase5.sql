



USE waste2worth;

ALTER TABLE UpcycledCrafts
ADD COLUMN creationDate DATE NULL COMMENT 'When the physical item was made',
ADD COLUMN careInstructions TEXT NULL COMMENT 'How to take care of the item';
