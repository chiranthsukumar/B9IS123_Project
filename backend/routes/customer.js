import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Name and phone are required' 
            });
        }

        const sql = `INSERT INTO customers (name, phone, email, address) 
                     VALUES (?, ?, ?, ?)`;
        const result = await dbHelpers.run(sql, [name, phone, email, address]);
        
        res.status(201).json({
            message: 'Customer created successfully',
            customer: {
                id: result.id,
                name,
                phone,
                email,
                address
            }
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

router.get('/', async (req, res) => {
    try {
        const sql = `SELECT * FROM customers ORDER BY created_date DESC`;
        const customers = await dbHelpers.all(sql);
        
        res.json({
            message: 'Customers retrieved successfully',
            customers: customers,
            count: customers.length
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM customers WHERE id = ?`;
        const customer = await dbHelpers.get(sql, [id]);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({
            message: 'Customer retrieved successfully',
            customer: customer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        
        const existingCustomer = await dbHelpers.get(
            'SELECT * FROM customers WHERE id = ?', [id]
        );
        
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Basic validation
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Name and phone are required' 
            });
        }
        
        const sql = `UPDATE customers 
                     SET name = ?, phone = ?, email = ?, address = ?
                     WHERE id = ?`;
        await dbHelpers.run(sql, [name, phone, email, address, id]);
        
        res.json({
            message: 'Customer updated successfully',
            customer: {
                id: parseInt(id),
                name,
                phone,
                email,
                address
            }
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingCustomer = await dbHelpers.get(
            'SELECT * FROM customers WHERE id = ?', [id]
        );
        
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const vehicles = await dbHelpers.all(
            'SELECT * FROM vehicles WHERE customer_id = ?', [id]
        );
        
        if (vehicles.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with associated vehicles',
                vehicleCount: vehicles.length
            });
        }
        
        const sql = 'DELETE FROM customers WHERE id = ?';
        await dbHelpers.run(sql, [id]);
        
        res.json({
            message: 'Customer deleted successfully',
            deletedCustomer: existingCustomer
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

router.get('/stats/summary', async (req, res) => {
    try {
        const totalCustomers = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM customers'
        );
        
        const customersWithVehicles = await dbHelpers.get(
            `SELECT COUNT(DISTINCT customer_id) as count 
             FROM vehicles`
        );
        
        res.json({
            message: 'Customer statistics retrieved successfully',
            stats: {
                totalCustomers: totalCustomers.count,
                customersWithVehicles: customersWithVehicles.count,
                customersWithoutVehicles: totalCustomers.count - customersWithVehicles.count
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({ error: 'Failed to fetch customer statistics' });
    }
});

module.exports = router;