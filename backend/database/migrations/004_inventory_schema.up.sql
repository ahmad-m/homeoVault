-- Phase 6 UP Migration
-- Inventory Management Tables

-- 1. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_potency_id UUID UNIQUE NOT NULL REFERENCES medicine_potencies(id) ON DELETE RESTRICT,
    current_quantity INTEGER DEFAULT 0 NOT NULL,
    minimum_quantity INTEGER DEFAULT 0 NOT NULL,
    maximum_quantity INTEGER DEFAULT 1000 NOT NULL,
    reorder_level INTEGER DEFAULT 0 NOT NULL,
    default_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Inventory Batches Table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    mrp DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    manufactured_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (inventory_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_inv_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inv_batches_inventory ON inventory_batches(inventory_id);

CREATE TRIGGER update_inventory_batches_updated_at
BEFORE UPDATE ON inventory_batches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Stock Transactions Table
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT')),
    inventory_batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    reference_number VARCHAR(100),
    remarks TEXT,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_txs_batch ON stock_transactions(inventory_batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_txs_date ON stock_transactions(transaction_date);
