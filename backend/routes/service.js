const express = require('express');
const { dbHelpers } = require('../database');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { vehicle_id, service_date, description, cost, status } = req.body;
        
        if (!vehicle_id || !service_date || !description || !cost) {
            return res.status(400).json({ 
                error: 'Required fields: vehicle_id, service_date, description, cost' 
            });
        }
        
        const vehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE id = ?', [vehicle_id]
        );
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        const costNum = parseFloat(cost);
        if (isNaN(costNum) || costNum < 0) {
            return res.status(400).json({ error: 'Cost must be a valid positive number' });
        }

        const sql = `INSERT INTO services (vehicle_id, service_date, description, cost, status) 
                     VALUES (?, ?, ?, ?, ?)`;
        const result = await dbHelpers.run(sql, [
            vehicle_id, 
            service_date, 
            description, 
            costNum, 
            status || 'completed'
        ]);
        
        res.status(201).json({
            message: 'Service record created successfully',
            service: {
                id: result.id,
                vehicle_id,
                service_date,
                description,
                cost: costNum,
                status: status || 'completed'
            }
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service record' });
    }
});

router.get('/', async (req, res) => {
    try {
        const sql = `SELECT s.*, 
                            v.make, v.model, v.year, v.license_plate,
                            c.name as customer_name, c.phone as customer_phone
                     FROM services s
                     JOIN vehicles v ON s.vehicle_id = v.id
                     JOIN customers c ON v.customer_id = c.id
                     ORDER BY s.service_date DESC`;
        const services = await dbHelpers.all(sql);
        
        res.json({
            message: 'Services retrieved successfully',
            services: services,
            count: services.length
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT s.*, 
                            v.make, v.model, v.year, v.license_plate,
                            c.name as customer_name, c.phone as customer_phone, c.email as customer_email
                     FROM services s
                     JOIN vehicles v ON s.vehicle_id = v.id
                     JOIN customers c ON v.customer_id = c.id
                     WHERE s.id = ?`;
        const service = await dbHelpers.get(sql, [id]);
        
        if (!service) {
            return res.status(404).json({ error: 'Service record not found' });
        }
        
        res.json({
            message: 'Service retrieved successfully',
            service: service
        });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

router.get('/vehicle/:vehicle_id', async (req, res) => {
    try {
        const { vehicle_id } = req.params;
        const sql = `SELECT s.*, 
                            v.make, v.model, v.year, v.license_plate,
                            c.name as customer_name
                     FROM services s
                     JOIN vehicles v ON s.vehicle_id = v.id
                     JOIN customers c ON v.customer_id = c.id
                     WHERE s.vehicle_id = ? 
                     ORDER BY s.service_date DESC`;
        const services = await dbHelpers.all(sql, [vehicle_id]);
        
        res.json({
            message: 'Vehicle service history retrieved successfully',
            services: services,
            count: services.length,
            vehicle_id: parseInt(vehicle_id)
        });
    } catch (error) {
        console.error('Error fetching vehicle services:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle service history' });
    }
});

router.get('/customer/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const sql = `SELECT s.*, 
                            v.make, v.model, v.year, v.license_plate
                     FROM services s
                     JOIN vehicles v ON s.vehicle_id = v.id
                     WHERE v.customer_id = ? 
                     ORDER BY s.service_date DESC`;
        const services = await dbHelpers.all(sql, [customer_id]);
        
        res.json({
            message: 'Customer service history retrieved successfully',
            services: services,
            count: services.length,
            customer_id: parseInt(customer_id)
        });
    } catch (error) {
        console.error('Error fetching customer services:', error);
        res.status(500).json({ error: 'Failed to fetch customer service history' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_id, service_date, description, cost, status } = req.body;
        
        // Check if service exists
        const existingService = await dbHelpers.get(
            'SELECT * FROM services WHERE id = ?', [id]
        );
        
        if (!existingService) {
            return res.status(404).json({ error: 'Service record not found' });
        }
        
        if (!vehicle_id || !service_date || !description || !cost) {
            return res.status(400).json({ 
                error: 'Required fields: vehicle_id, service_date, description, cost' 
            });
        }
        
        const vehicle = await dbHelpers.get(
            'SELECT * FROM vehicles WHERE id = ?', [vehicle_id]
        );
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        const costNum = parseFloat(cost);
        if (isNaN(costNum) || costNum < 0) {
            return res.status(400).json({ error: 'Cost must be a valid positive number' });
        }
        
        const sql = `UPDATE services 
                     SET vehicle_id = ?, service_date = ?, description = ?, cost = ?, status = ?
                     WHERE id = ?`;
        await dbHelpers.run(sql, [
            vehicle_id, 
            service_date, 
            description, 
            costNum, 
            status || 'completed', 
            id
        ]);
        
        res.json({
            message: 'Service record updated successfully',
            service: {
                id: parseInt(id),
                vehicle_id,
                service_date,
                description,
                cost: costNum,
                status: status || 'completed'
            }
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service record' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if service exists
        const existingService = await dbHelpers.get(
            'SELECT * FROM services WHERE id = ?', [id]
        );
        
        if (!existingService) {
            return res.status(404).json({ error: 'Service record not found' });
        }
        
        const sql = 'DELETE FROM services WHERE id = ?';
        await dbHelpers.run(sql, [id]);
        
        res.json({
            message: 'Service record deleted successfully',
            deletedService: existingService
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service record' });
    }
});

module.exports = router;