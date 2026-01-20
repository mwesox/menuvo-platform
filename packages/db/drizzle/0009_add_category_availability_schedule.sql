-- Add availability_schedule column to categories table
-- This column stores JSONB configuration for category availability scheduling
-- null = category is always visible
-- {"enabled": false} = schedule disabled, category always visible
-- {"enabled": true, ...} = schedule enabled with rules

ALTER TABLE categories
    ADD COLUMN availability_schedule jsonb DEFAULT '{"enabled": false}'::jsonb;

-- Add ai_recommendations column to store_settings table
-- This column stores JSONB configuration for AI recommendations feature

ALTER TABLE store_settings
    ADD COLUMN ai_recommendations jsonb;
