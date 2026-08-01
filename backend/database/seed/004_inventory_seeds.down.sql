-- Phase 6 DOWN Seed Data
-- Reverts Phase 6 seed adjustments, deletes seeded locations

DELETE FROM locations WHERE name IN ('Home Cabinet', 'Bedroom', 'Kitchen', 'Emergency Box', 'Travel Kit', 'Other');
