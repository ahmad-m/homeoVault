-- Phase 5 UP Migration
-- Medicine Master normalized database schemas

-- 1. Medicine Categories Table
CREATE TABLE IF NOT EXISTS medicine_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_med_categories_updated_at
BEFORE UPDATE ON medicine_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Manufacturers Table
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_manufacturers_updated_at
BEFORE UPDATE ON manufacturers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Medicine Forms Table
CREATE TABLE IF NOT EXISTS medicine_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_medicine_forms_updated_at
BEFORE UPDATE ON medicine_forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Potencies Table
CREATE TABLE IF NOT EXISTS potencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_potencies_updated_at
BEFORE UPDATE ON potencies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Medicines Core Table
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    latin_name VARCHAR(255),
    common_name VARCHAR(255),
    short_name VARCHAR(100),
    description TEXT,
    category_id UUID NOT NULL REFERENCES medicine_categories(id) ON DELETE RESTRICT,
    default_form_id UUID REFERENCES medicine_forms(id) ON DELETE SET NULL,
    min_stock INTEGER DEFAULT 0 NOT NULL,
    storage_instructions TEXT,
    notes TEXT,
    search_keywords TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_default_form ON medicines(default_form_id);

CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON medicines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Medicine Potencies Relation Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS medicine_potencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    potency_id UUID NOT NULL REFERENCES potencies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (medicine_id, potency_id)
);

CREATE INDEX IF NOT EXISTS idx_med_potencies_medicine ON medicine_potencies(medicine_id);
CREATE INDEX IF NOT EXISTS idx_med_potencies_potency ON medicine_potencies(potency_id);

-- 7. Medicine Aliases Table (For multiple naming matches)
CREATE TABLE IF NOT EXISTS medicine_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (medicine_id, alias_name)
);

CREATE INDEX IF NOT EXISTS idx_med_aliases_medicine ON medicine_aliases(medicine_id);
CREATE INDEX IF NOT EXISTS idx_med_aliases_name ON medicine_aliases(alias_name);

-- 8. Medicine Images Table
CREATE TABLE IF NOT EXISTS medicine_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_med_images_medicine ON medicine_images(medicine_id);

-- 9. Medicine Tags Table
CREATE TABLE IF NOT EXISTS medicine_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (medicine_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_med_tags_medicine ON medicine_tags(medicine_id);
CREATE INDEX IF NOT EXISTS idx_med_tags_name ON medicine_tags(tag_name);

-- 10. Medicine Manufacturers Relation Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS medicine_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (medicine_id, manufacturer_id)
);

CREATE INDEX IF NOT EXISTS idx_med_mfrs_medicine ON medicine_manufacturers(medicine_id);
CREATE INDEX IF NOT EXISTS idx_med_mfrs_manufacturer ON medicine_manufacturers(manufacturer_id);
