-- Phase 5 DOWN Seed Data
-- Rollback: Clears all default categories, potencies, forms, and manufacturers

DELETE FROM manufacturers WHERE name IN ('SBL','Dr Reckeweg','Bakson','Allen','Wheezal','Hapdco','Adel','Schwabe','Boiron','Medisynth','Haslab','Bhandari','Bhargava','Others');
DELETE FROM medicine_forms WHERE name IN ('Globules','Dilution','Mother Tincture','Tablet','Ointment','Cream','Gel','Drops','Liquid','Powder','Spray');
DELETE FROM potencies WHERE name IN ('Q','1X','2X','3X','6X','12X','30X','200X','3C','6C','12C','30C','200C','1M','10M','50M','CM','MM','LM1','LM2','LM3','LM6','LM12');
DELETE FROM medicine_categories WHERE name IN ('Single Remedy','Mother Tincture','Biochemic','Bach Flower','Combination','Ointment','Tablet','Dilution','Trituration','External Application','Eye Drop','Hair Oil','Speciality','Veterinary','Nosodes','Sarcodes','Organ Remedies','Tissue Salts');
