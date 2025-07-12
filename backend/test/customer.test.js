const request = require('supertest');
const app = require('../server');
const { dbHelpers } = require('../database');

describe('Customer API Tests', () => {
    let testCustomerId;

    // Test data
    const testCustomer = {
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john.doe@email.com',
        address: '123 Main St, Dublin'
    };

    const updatedCustomer = {
        name: 'John Smith',
        phone: '987-654-3210',
        email: 'john.smith@email.com',
        address: '456 Oak Ave, Dublin'
    };

    // Clean up test data after all tests
    afterAll(async () => {
        if (testCustomerId) {
            try {
                await dbHelpers.run('DELETE FROM customers WHERE id = ?', [testCustomerId]);
            } catch (error) {
                console.log('Customer already deleted or not found');
            }
        }
    });

    describe('POST /api/customers - CREATE Customer', () => {
        test('should create a new customer', async () => {
            const response = await request(app)
                .post('/api/customers')
                .send(testCustomer)
                .expect(201);

            expect(response.body.message).toBe('Customer created successfully');
            expect(response.body.customer.name).toBe(testCustomer.name);
            expect(response.body.customer.phone).toBe(testCustomer.phone);
            expect(response.body.customer.id).toBeDefined();
            
            // Store ID for other tests
            testCustomerId = response.body.customer.id;
        });

        test('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/customers')
                .send({ name: 'Jane Doe' }) // Missing phone
                .expect(400);

            expect(response.body.error).toBe('Name and phone are required');
        });

        test('should create customer with minimal required fields', async () => {
            const minimalCustomer = {
                name: 'Minimal Customer',
                phone: '555-0000'
            };

            const response = await request(app)
                .post('/api/customers')
                .send(minimalCustomer)
                .expect(201);

            expect(response.body.customer.name).toBe(minimalCustomer.name);
            expect(response.body.customer.phone).toBe(minimalCustomer.phone);
            expect(response.body.customer.email).toBeNull();
            expect(response.body.customer.address).toBeNull();
            
            // Clean up this test customer
            await dbHelpers.run('DELETE FROM customers WHERE id = ?', [response.body.customer.id]);
        });
    });

    describe('GET /api/customers - READ Customers', () => {
        test('should get all customers', async () => {
            const response = await request(app)
                .get('/api/customers')
                .expect(200);

            expect(response.body.message).toBe('Customers retrieved successfully');
            expect(response.body.customers).toBeInstanceOf(Array);
            expect(response.body.count).toBeGreaterThan(0);
            
            // Check if our test customer is included
            const testCust = response.body.customers.find(c => c.id === testCustomerId);
            expect(testCust).toBeDefined();
        });

        test('should get a customer by ID', async () => {
            const response = await request(app)
                .get(`/api/customers/${testCustomerId}`)
                .expect(200);

            expect(response.body.message).toBe('Customer retrieved successfully');
            expect(response.body.customer.name).toBe(testCustomer.name);
            expect(response.body.customer.id).toBe(testCustomerId);
        });

        test('should return 404 for non-existent customer', async () => {
            const response = await request(app)
                .get('/api/customers/99999')
                .expect(404);

            expect(response.body.error).toBe('Customer not found');
        });
    });

    describe('PUT /api/customers/:id - UPDATE Customer', () => {
        test('should update a customer', async () => {
            const response = await request(app)
                .put(`/api/customers/${testCustomerId}`)
                .send(updatedCustomer)
                .expect(200);

            expect(response.body.message).toBe('Customer updated successfully');
            expect(response.body.customer.name).toBe(updatedCustomer.name);
            expect(response.body.customer.phone).toBe(updatedCustomer.phone);
        });

        test('should return 404 for non-existent customer', async () => {
            const response = await request(app)
                .put('/api/customers/99999')
                .send(updatedCustomer)
                .expect(404);

            expect(response.body.error).toBe('Customer not found');
        });

        test('should return error for missing required fields in update', async () => {
            const response = await request(app)
                .put(`/api/customers/${testCustomerId}`)
                .send({ name: 'Only Name' }) // Missing phone
                .expect(400);

            expect(response.body.error).toBe('Name and phone are required');
        });
    });

    describe('GET /api/customers/search/:query - SEARCH Customers', () => {
        test('should search customers by name', async () => {
            const response = await request(app)
                .get('/api/customers/search/John')
                .expect(200);

            expect(response.body.message).toBe('Search completed successfully');
            expect(response.body.customers).toBeInstanceOf(Array);
            expect(response.body.searchQuery).toBe('John');
            
            // Should find our test customer
            const foundCustomer = response.body.customers.find(c => c.id === testCustomerId);
            expect(foundCustomer).toBeDefined();
        });

        test('should search customers by phone', async () => {
            const response = await request(app)
                .get(`/api/customers/search/${updatedCustomer.phone}`)
                .expect(200);

            expect(response.body.customers.length).toBeGreaterThan(0);
            expect(response.body.customers[0].phone).toBe(updatedCustomer.phone);
        });

        test('should return empty array for no matches', async () => {
            const response = await request(app)
                .get('/api/customers/search/NonExistentCustomer123')
                .expect(200);

            expect(response.body.customers).toBeInstanceOf(Array);
            expect(response.body.customers.length).toBe(0);
        });
    });

    describe('DELETE /api/customers/:id - DELETE Customer', () => {
        test('should not delete customer with associated vehicles', async () => {
            // First create a vehicle for the customer
            const vehicleData = {
                customer_id: testCustomerId,
                make: 'Toyota',
                model: 'Camry',
                year: 2020,
                license_plate: 'DEL-TEST'
            };

            const vehicleResponse = await request(app)
                .post('/api/vehicles')
                .send(vehicleData)
                .expect(201);

            // Try to delete customer with vehicle
            const deleteResponse = await request(app)
                .delete(`/api/customers/${testCustomerId}`)
                .expect(400);

            expect(deleteResponse.body.error).toBe('Cannot delete customer with associated vehicles');
            expect(deleteResponse.body.vehicleCount).toBe(1);

            // Clean up the vehicle first
            await dbHelpers.run('DELETE FROM vehicles WHERE id = ?', [vehicleResponse.body.vehicle.id]);
        });

        test('should delete a customer without vehicles', async () => {
            const response = await request(app)
                .delete(`/api/customers/${testCustomerId}`)
                .expect(200);

            expect(response.body.message).toBe('Customer deleted successfully');
            expect(response.body.deletedCustomer.id).toBe(testCustomerId);
            
            // Clear ID since customer is deleted
            testCustomerId = null;
        });

        test('should return 404 for non-existent customer', async () => {
            const response = await request(app)
                .delete('/api/customers/99999')
                .expect(404);

            expect(response.body.error).toBe('Customer not found');
        });
    });

    describe('Customer Statistics', () => {
        test('should get customer statistics', async () => {
            const response = await request(app)
                .get('/api/customers/stats/summary')
                .expect(200);

            expect(response.body.message).toBe('Customer statistics retrieved successfully');
            expect(response.body.stats.totalCustomers).toBeGreaterThanOrEqual(0);
            expect(response.body.stats.customersWithVehicles).toBeGreaterThanOrEqual(0);
            expect(response.body.stats.customersWithoutVehicles).toBeGreaterThanOrEqual(0);
        });
    });
});