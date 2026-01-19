-- Convert displayOrder columns from integer to text for fractional indexing
-- This enables single-update reordering (no N+1 updates when moving items)

-- Step 1: Add temporary text columns
ALTER TABLE categories ADD COLUMN display_order_new text;
ALTER TABLE items ADD COLUMN display_order_new text;
ALTER TABLE option_groups ADD COLUMN display_order_new text;
ALTER TABLE option_choices ADD COLUMN display_order_new text;
ALTER TABLE item_option_groups ADD COLUMN display_order_new text;

-- Step 2: Migrate existing integer values to fractional keys
-- Format: 'a' + zero-padded number for proper lexicographic sorting
-- Examples: 0 -> 'a0000', 1 -> 'a0001', 10 -> 'a0010', 100 -> 'a0100'
UPDATE categories SET display_order_new = 'a' || LPAD(display_order::text, 4, '0');
UPDATE items SET display_order_new = 'a' || LPAD(display_order::text, 4, '0');
UPDATE option_groups SET display_order_new = 'a' || LPAD(display_order::text, 4, '0');
UPDATE option_choices SET display_order_new = 'a' || LPAD(display_order::text, 4, '0');
UPDATE item_option_groups SET display_order_new = 'a' || LPAD(display_order::text, 4, '0');

-- Step 3: Drop old columns and rename new ones
ALTER TABLE categories DROP COLUMN display_order;
ALTER TABLE categories RENAME COLUMN display_order_new TO display_order;
ALTER TABLE categories ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE categories ALTER COLUMN display_order SET DEFAULT 'a0000';

ALTER TABLE items DROP COLUMN display_order;
ALTER TABLE items RENAME COLUMN display_order_new TO display_order;
ALTER TABLE items ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE items ALTER COLUMN display_order SET DEFAULT 'a0000';

ALTER TABLE option_groups DROP COLUMN display_order;
ALTER TABLE option_groups RENAME COLUMN display_order_new TO display_order;
ALTER TABLE option_groups ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE option_groups ALTER COLUMN display_order SET DEFAULT 'a0000';

ALTER TABLE option_choices DROP COLUMN display_order;
ALTER TABLE option_choices RENAME COLUMN display_order_new TO display_order;
ALTER TABLE option_choices ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE option_choices ALTER COLUMN display_order SET DEFAULT 'a0000';

ALTER TABLE item_option_groups DROP COLUMN display_order;
ALTER TABLE item_option_groups RENAME COLUMN display_order_new TO display_order;
ALTER TABLE item_option_groups ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE item_option_groups ALTER COLUMN display_order SET DEFAULT 'a0000';
