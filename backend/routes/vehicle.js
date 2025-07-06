const express = require('express');
const { dbHelpers } = require('../database');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { customer_id, make, model, year, license_plate } = req.body;
        
        if (!customer_id || !make || !model || !year || !license_plate) {
            return res.status(400).json({ 
                error: 'All fields are required: customer_id, make, model, year, license_plate' 
            });
        }
        
        const customer = await dbHelpers.get(
            'SELECT * FROM customers WHERE id = ?', [customer_id]
        );
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const existingVehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE license_plate = ?', [license_plate]
        );
        
        if (existingVehicle) {
            return res.status(400).json({ 
                error: 'Vehicle with this license plate already exists' 
            });
        }

        const sql = `INSERT INTO vehicles (customer_id, make, model, year, license_plate) 
                     VALUES (?, ?, ?, ?, ?)`;
        const result = await dbHelpers.run(sql, [customer_id, make, model, year, license_plate]);
        
        res.status(201).json({
            message: 'Vehicle created successfully',
            vehicle: {
                id: result.id,
                customer_id,
                make,
                model,
                year,
                license_plate
            }
        });
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

router.get('/', async (req, res) => {
    try {
        const sql = `SELECT v.*, c.name as customer_name, c.phone as customer_phone
                     FROM vehicles v
                     JOIN customers c ON v.customer_id = c.id
                     ORDER BY v.created_date DESC`;
        const vehicles = await dbHelpers.all(sql);
        
        res.json({
            message: 'Vehicles retrieved successfully',
            vehicles: vehicles,
            count: vehicles.length
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
                     FROM vehicles v
                     JOIN customers c ON v.customer_id = c.id
                     WHERE v.id = ?`;
        const vehicle = await dbHelpers.get(sql, [id]);
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        res.json({
            message: 'Vehicle retrieved successfully',
            vehicle: vehicle
        });
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

router.get('/customer/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const sql = `SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_date DESC`;
        const vehicles = await dbHelpers.all(sql, [customer_id]);
        
        res.json({
            message: 'Customer vehicles retrieved successfully',
            vehicles: vehicles,
            count: vehicles.length,
            customer_id: parseInt(customer_id)
        });
    } catch (error) {
        console.error('Error fetching customer vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch customer vehicles' });
    }
});

router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const sql = `SELECT v.*, c.name as customer_name, c.phone as customer_phone
                     FROM vehicles v
                     JOIN customers c ON v.customer_id = c.id
                     WHERE v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ?
                     ORDER BY v.make, v.model`;
        const searchTerm = `%${query}%`;
        const vehicles = await dbHelpers.all(sql, [searchTerm, searchTerm, searchTerm]);
        
        res.json({
            message: 'Vehicle search completed successfully',
            vehicles: vehicles,
            count: vehicles.length,
            searchQuery: query
        });
    } catch (error) {
        console.error('Error searching vehicles:', error);
        res.status(500).json({ error: 'Failed to search vehicles' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_id, make, model, year, license_plate } = req.body;
        
        const existingVehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE id = ?', [id]
        );
        
        if (!existingVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        if (!customer_id || !make || !model || !year || !license_plate) {
            return res.status(400).json({ 
                error: 'All fields are required: customer_id, make, model, year, license_plate' 
            });
        }
        
        const customer = await dbHelpers.get(
            'SELECT * FROM customers WHERE id = ?', [customer_id]
        );
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const duplicateVehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE license_plate = ? AND id != ?', 
            [license_plate, id]
        );
        
        if (duplicateVehicle) {
            return res.status(400).json({ 
                error: 'Vehicle with this license plate already exists' 
            });
        }
        
        const sql = `UPDATE vehicles 
                     SET customer_id = ?, make = ?, model = ?, year = ?, license_plate = ?
                     WHERE id = ?`;
        await dbHelpers.run(sql, [customer_id, make, model, year, license_plate, id]);
        
        res.json({
            message: 'Vehicle updated successfully',
            vehicle: {
                id: parseInt(id),
                customer_id,
                make,
                model,
                year,
                license_plate
            }
        });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingVehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE id = ?', [id]
        );
        
        if (!existingVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        const services = await dbHelpers.all(
            'SELECT * FROM services WHERE vehicle_id = ?', [id]
        );
        
        if (services.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete vehicle with associated service records',
                serviceCount: services.length
            });
        }
        
        const sql = 'DELETE FROM vehicles WHERE id = ?';
        await dbHelpers.run(sql, [id]);
        
        res.json({
            message: 'Vehicle deleted successfully',
            deletedVehicle: existingVehicle
        });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

router.get('/stats/summary', async (req, res) => {
    try {
        const totalVehicles = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM vehicles'
        );
        
        const vehiclesByMake = await dbHelpers.all(
            'SELECT make, COUNT(*) as count FROM vehicles GROUP BY make ORDER BY count DESC'
        );
        
        const averageYear = await dbHelpers.get(
            'SELECT AVG(year) as avg_year FROM vehicles'
        );
        
        res.json({
            message: 'Vehicle statistics retrieved successfully',
            stats: {
                totalVehicles: totalVehicles.count,
                vehiclesByMake: vehiclesByMake,
                averageYear: Math.round(averageYear.avg_year) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching vehicle stats:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle statistics' });
    }
});

module.exports = router;