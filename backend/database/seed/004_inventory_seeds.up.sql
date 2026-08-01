-- Phase 6 UP Seed Data
-- Seeds storage locations

INSERT INTO locations (name, description) VALUES
('Home Cabinet', 'Main storage cupboard in the living room for regular remedies.'),
('Bedroom', 'Drawer or box kept near the bedside.'),
('Kitchen', 'Upper cabinet shelf reserved for first aid and daily supplements.'),
('Emergency Box', 'Lockbox for immediate-needs and rescue tinctures.'),
('Travel Kit', 'Portable pouch containing essentials for trips.'),
('Other', 'Custom cabinets or unspecified locations.')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Suppliers
INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES
('Schwabe Distributor', 'John Doe', 'schwabe@distributor.com', '1234567890', '12 Main Street'),
('SBL Pharmacy Agency', 'Jane Smith', 'sbl@agency.com', '9876543210', '45 Park Avenue')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed Inventory
INSERT INTO inventory (medicine_potency_id, current_quantity, minimum_quantity, maximum_quantity, reorder_level, default_location_id)
VALUES (
  (SELECT mp.id FROM medicine_potencies mp 
   JOIN medicines m ON mp.medicine_id = m.id 
   JOIN potencies p ON mp.potency_id = p.id 
   WHERE m.name = 'Arnica Montana' AND p.name = '30C' LIMIT 1),
  15,
  5,
  100,
  10,
  (SELECT id FROM locations WHERE name = 'Home Cabinet' LIMIT 1)
) ON CONFLICT (medicine_potency_id) DO NOTHING;

INSERT INTO inventory (medicine_potency_id, current_quantity, minimum_quantity, maximum_quantity, reorder_level, default_location_id)
VALUES (
  (SELECT mp.id FROM medicine_potencies mp 
   JOIN medicines m ON mp.medicine_id = m.id 
   JOIN potencies p ON mp.potency_id = p.id 
   WHERE m.name = 'Nux Vomica' AND p.name = '30C' LIMIT 1),
  2,
  5,
  100,
  10,
  (SELECT id FROM locations WHERE name = 'Home Cabinet' LIMIT 1)
) ON CONFLICT (medicine_potency_id) DO NOTHING;

INSERT INTO inventory (medicine_potency_id, current_quantity, minimum_quantity, maximum_quantity, reorder_level, default_location_id)
VALUES (
  (SELECT mp.id FROM medicine_potencies mp 
   JOIN medicines m ON mp.medicine_id = m.id 
   JOIN potencies p ON mp.potency_id = p.id 
   WHERE m.name = 'Arsenicum Album' AND p.name = '200C' LIMIT 1),
  20,
  5,
  100,
  10,
  (SELECT id FROM locations WHERE name = 'Home Cabinet' LIMIT 1)
) ON CONFLICT (medicine_potency_id) DO NOTHING;

INSERT INTO inventory (medicine_potency_id, current_quantity, minimum_quantity, maximum_quantity, reorder_level, default_location_id)
VALUES (
  (SELECT mp.id FROM medicine_potencies mp 
   JOIN medicines m ON mp.medicine_id = m.id 
   JOIN potencies p ON mp.potency_id = p.id 
   WHERE m.name = 'Belladonna' AND p.name = '30C' LIMIT 1),
  0,
  5,
  100,
  10,
  (SELECT id FROM locations WHERE name = 'Emergency Box' LIMIT 1)
) ON CONFLICT (medicine_potency_id) DO NOTHING;

-- 4. Seed Inventory Batches
INSERT INTO inventory_batches (inventory_id, batch_number, expiry_date, purchase_price, mrp, supplier_id, quantity, available_quantity, remarks)
VALUES (
  (SELECT id FROM inventory WHERE medicine_potency_id = 
    (SELECT mp.id FROM medicine_potencies mp 
     JOIN medicines m ON mp.medicine_id = m.id 
     JOIN potencies p ON mp.potency_id = p.id 
     WHERE m.name = 'Arnica Montana' AND p.name = '30C' LIMIT 1)),
  'ARN-30C-001',
  '2030-12-31',
  8.50,
  12.00,
  (SELECT id FROM suppliers WHERE name = 'Schwabe Distributor' LIMIT 1),
  15,
  15,
  'Initial stock seed'
) ON CONFLICT (inventory_id, batch_number) DO NOTHING;

INSERT INTO inventory_batches (inventory_id, batch_number, expiry_date, purchase_price, mrp, supplier_id, quantity, available_quantity, remarks)
VALUES (
  (SELECT id FROM inventory WHERE medicine_potency_id = 
    (SELECT mp.id FROM medicine_potencies mp 
     JOIN medicines m ON mp.medicine_id = m.id 
     JOIN potencies p ON mp.potency_id = p.id 
     WHERE m.name = 'Nux Vomica' AND p.name = '30C' LIMIT 1)),
  'NUX-30C-001',
  '2030-12-31',
  7.00,
  10.00,
  (SELECT id FROM suppliers WHERE name = 'SBL Pharmacy Agency' LIMIT 1),
  2,
  2,
  'Low stock seed'
) ON CONFLICT (inventory_id, batch_number) DO NOTHING;

INSERT INTO inventory_batches (inventory_id, batch_number, expiry_date, purchase_price, mrp, supplier_id, quantity, available_quantity, remarks)
VALUES (
  (SELECT id FROM inventory WHERE medicine_potency_id = 
    (SELECT mp.id FROM medicine_potencies mp 
     JOIN medicines m ON mp.medicine_id = m.id 
     JOIN potencies p ON mp.potency_id = p.id 
     WHERE m.name = 'Arsenicum Album' AND p.name = '200C' LIMIT 1)),
  'ARS-200C-001',
  '2030-12-31',
  9.00,
  15.00,
  (SELECT id FROM suppliers WHERE name = 'Schwabe Distributor' LIMIT 1),
  20,
  20,
  'Plenty stock seed'
) ON CONFLICT (inventory_id, batch_number) DO NOTHING;
