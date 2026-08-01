-- Phase 5 DOWN Migration
-- Reverts Phase 5 changes, drops all Medicine Master tables

DROP TABLE IF EXISTS medicine_manufacturers CASCADE;
DROP TABLE IF EXISTS medicine_tags CASCADE;
DROP TABLE IF EXISTS medicine_images CASCADE;
DROP TABLE IF EXISTS medicine_aliases CASCADE;
DROP TABLE IF EXISTS medicine_potencies CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS potencies CASCADE;
DROP TABLE IF EXISTS medicine_forms CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS medicine_categories CASCADE;
