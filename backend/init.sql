CREATE TABLE IF NOT EXISTS customers(
    customer_id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_number TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    vehicle_model TEXT NOT NULL    
);

