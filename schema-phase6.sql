



USE waste2worth;

ALTER TABLE UpcycledCrafts
  ADD COLUMN origin            VARCHAR(255)  NULL COMMENT 'Where the waste came from',
  ADD COLUMN materialsUsed     VARCHAR(255)  NULL COMMENT 'List of raw materials used',
  ADD COLUMN transformation    TEXT          NULL COMMENT 'How waste became a product',
  ADD COLUMN unitsRecycled     INT           NULL COMMENT 'Number of units recycled (e.g. 48 bottles)',
  ADD COLUMN wasteKgDiverted   DECIMAL(8,2)  NULL COMMENT 'kg of waste kept out of landfill',
  ADD COLUMN environmentalNote TEXT          NULL COMMENT 'Other env. impact notes';
