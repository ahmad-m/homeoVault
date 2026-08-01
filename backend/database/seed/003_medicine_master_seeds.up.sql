-- Phase 5 UP Seed Data
-- Seeds Categories, Potencies, Forms, and Manufacturers

-- 1. Seed Categories
INSERT INTO medicine_categories (name) VALUES
('Single Remedy'),
('Mother Tincture'),
('Biochemic'),
('Bach Flower'),
('Combination'),
('Ointment'),
('Tablet'),
('Dilution'),
('Trituration'),
('External Application'),
('Eye Drop'),
('Hair Oil'),
('Speciality'),
('Veterinary'),
('Nosodes'),
('Sarcodes'),
('Organ Remedies'),
('Tissue Salts')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Potencies
INSERT INTO potencies (name, display_order) VALUES
('Q', 1),
('1X', 2),
('2X', 3),
('3X', 4),
('6X', 5),
('12X', 6),
('30X', 7),
('200X', 8),
('3C', 9),
('6C', 10),
('12C', 11),
('30C', 12),
('200C', 13),
('1M', 14),
('10M', 15),
('50M', 16),
('CM', 17),
('MM', 18),
('LM1', 19),
('LM2', 20),
('LM3', 21),
('LM6', 22),
('LM12', 23)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- 3. Seed Forms
INSERT INTO medicine_forms (name) VALUES
('Globules'),
('Dilution'),
('Mother Tincture'),
('Tablet'),
('Ointment'),
('Cream'),
('Gel'),
('Drops'),
('Liquid'),
('Powder'),
('Spray')
ON CONFLICT (name) DO NOTHING;

-- 4. Seed Manufacturers
INSERT INTO manufacturers (name) VALUES
('SBL'),
('Dr Reckeweg'),
('Bakson'),
('Allen'),
('Wheezal'),
('Hapdco'),
('Adel'),
('Schwabe'),
('Boiron'),
('Medisynth'),
('Haslab'),
('Bhandari'),
('Bhargava'),
('Others')
ON CONFLICT (name) DO NOTHING;

-- 5. Seed Core Medicines
INSERT INTO medicines (name, latin_name, common_name, short_name, description, category_id, default_form_id, min_stock, search_keywords) VALUES
('Arnica Montana', 'Arnica montana', 'Leopard''s Bane', 'Arnica', 'Primary remedy for trauma, muscle injury, bruising, and shock.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'bruise, injury, soreness, arnica'),
('Nux Vomica', 'Strychnos nux-vomica', 'Poison Nut', 'Nux Vom', 'Digestive issues, overindulgence, stress, irritability, and hangovers.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'digestive, hangover, stress, stomach'),
('Arsenicum Album', 'Arsenious Acid', 'White Oxide of Arsenic', 'Ars Alb', 'Anxiety, restlessness, food poisoning, watery discharges, and chills.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'food poisoning, anxiety, flu, chill'),
('Belladonna', 'Atropa belladonna', 'Deadly Nightshade', 'Bell', 'Sudden fever, redness, hot skin, throat inflammation, and throbbing headache.', 
 (SELECT id FROM medicine_categories WHERE name = 'Dilution' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Dilution' LIMIT 1), 5, 'fever, headache, inflammation'),
('Bryonia Alba', 'White Bryony', 'Wild Hops', 'Bry', 'Dry cough, chest pain worsened by movement, joint pain, and extreme thirst.', 
 (SELECT id FROM medicine_categories WHERE name = 'Dilution' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Dilution' LIMIT 1), 5, 'cough, joint pain, chest pain, movement'),
('Lycopodium Clavatum', 'Lycopodium clavatum', 'Club Moss', 'Lyco', 'Bloating, gas, flatulence, performance anxiety, and symptoms worse on the right side.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'bloating, gas, digestion, right side'),
('Pulsatilla Nigricans', 'Anemone pratensis', 'Wind Flower', 'Puls', 'Clinging behavior, changeable symptoms, thick yellowish discharges, worse in warm rooms.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'cold, emotional, yellow discharge'),
('Gelsemium Sempervirens', 'Gelsemium sempervirens', 'Yellow Jasmine', 'Gels', 'Stage fright, anticipatory anxiety, heavy eyelids, influenza, and deep exhaustion.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'stage fright, flu, weakness, fatigue'),
('Aconitum Napellus', 'Aconitum napellus', 'Monkshood', 'Acon', 'Sudden onset of symptoms, panic, fear of death, dry cold wind exposure reactions.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'panic, fear, sudden onset, cold wind'),
('Rhus Toxicodendron', 'Rhus toxicodendron', 'Poison Ivy', 'Rhus Tox', 'Joint stiffness relieved by motion, skin rashes, hives, sprains, and restless limbs.', 
 (SELECT id FROM medicine_categories WHERE name = 'Single Remedy' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Globules' LIMIT 1), 5, 'stiffness, arthritis, skin rash, movement'),
('Calendula Officinalis Q', 'Calendula officinalis', 'Marigold', 'Calendula', 'Antibacterial and healing Mother Tincture for open cuts, burns, and wounds.', 
 (SELECT id FROM medicine_categories WHERE name = 'Mother Tincture' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Mother Tincture' LIMIT 1), 3, 'cut, wound, healing, antiseptic, calendula'),
('Calcarea Phosphorica', 'Calcium Phosphate', 'Calc Phos', 'Calc Phos', 'Biochemic tissue salt for bone growth, dentition, calcium deficiency, and teething children.', 
 (SELECT id FROM medicine_categories WHERE name = 'Biochemic' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Tablet' LIMIT 1), 5, 'bone, calcium, teething, biochemic'),
('Rescue Remedy', 'Bach Flower combination', 'Rescue Remedy', 'Rescue', 'Emergency Bach Flower drop formula for acute stress, panic, and shock.', 
 (SELECT id FROM medicine_categories WHERE name = 'Bach Flower' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Drops' LIMIT 1), 2, 'stress, emergency, anxiety, panic'),
('BC-18', 'Bio-Combination 18', 'BC 18', 'BC18', 'Homeopathic combination formula for Pyorrhoea, gum inflammation, and toothache.', 
 (SELECT id FROM medicine_categories WHERE name = 'Combination' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Tablet' LIMIT 1), 5, 'teeth, gum, pyorrhoea, combination'),
('Arnica Ointment', 'Arnica ointment formulation', 'Arnica Ointment', 'Arnica Oint', 'External soothing ointment application for muscle aches, bruises, and sprains.', 
 (SELECT id FROM medicine_categories WHERE name = 'Ointment' LIMIT 1), (SELECT id FROM medicine_forms WHERE name = 'Ointment' LIMIT 1), 4, 'external, muscle pain, sprain, ointment')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Medicine Potencies relation
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Arnica Montana' AND p.name IN ('30C', '200C', '1M', 'Q') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Nux Vomica' AND p.name IN ('30C', '200C', '1M') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Arsenicum Album' AND p.name IN ('30C', '200C', '1M') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Belladonna' AND p.name IN ('30C', '200C', '1M') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Bryonia Alba' AND p.name IN ('30C', '200C') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Lycopodium Clavatum' AND p.name IN ('30C', '200C', '1M') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Pulsatilla Nigricans' AND p.name IN ('30C', '200C') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Gelsemium Sempervirens' AND p.name IN ('30C', '200C') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Aconitum Napellus' AND p.name IN ('30C', '200C') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Rhus Toxicodendron' AND p.name IN ('30C', '200C', '1M') ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Calendula Officinalis Q' AND p.name = 'Q' ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Calcarea Phosphorica' AND p.name = '6X' ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Rescue Remedy' AND p.name = 'Q' ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'BC-18' AND p.name = '6X' ON CONFLICT DO NOTHING;
INSERT INTO medicine_potencies (medicine_id, potency_id)
SELECT m.id, p.id FROM medicines m, potencies p WHERE m.name = 'Arnica Ointment' AND p.name = 'Q' ON CONFLICT DO NOTHING;
