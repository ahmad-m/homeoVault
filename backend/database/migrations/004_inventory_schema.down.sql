-- Phase 6 DOWN Migration
-- Reverts Phase 6 changes, drops all inventory management tables

DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS inventory_batches CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
