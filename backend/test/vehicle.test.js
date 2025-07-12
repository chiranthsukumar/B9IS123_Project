const request = require('supertest');
const app = require('../server');
const { dbHelpers } = require('../database');

describe('Vehicle API Tests', () => {
    let testCustomerId, testVehicleId;

    // Test data
    const testCustomer = {
        name: 'Vehicle Test Customer',
        phone: '555-0100',
        email: 'vehicle.test@email.com',
        address: '100 Test St, Dublin'
    };

    const testVehicle = {
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        license_plate: 'VEH-123'
    };

    const updatedVehicle = {
        make: 'Honda',
        model: 'Accord',
        year: 2023,
        license_plate: 'VEH-456'
    };

    // Create test customer before running vehicle tests
    beforeAll(async () => {
        const customerResponse = await request(app)
            .post('/api/customers')
            .send(testCustomer);
        
        testCustomerId = customerResponse.body.customer.id;
        testVehicle.customer_id = testCustomerId;
        updatedVehicle.customer_id = testCustomerId;
    });

    // Clean up test data after all tests
    afterAll(async () => {
        if (testVehicleId) {
            try {
                await dbHelpers.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
            } catch (error) {
                console.log('Vehicle already deleted or not found');
            }
        }
        if (testCustomerId) {
            try {
                await dbHelpers.run('DELETE FROM customers WHERE id = ?', [testCustomerId]);
            } catch (error) {
                console.log('Customer already deleted or not found');
            }
        }
    });

    describe('POST /api/vehicles - CREATE Vehicle', () => {
        test('should create a new vehicle', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .send(testVehicle)
                .expect(201);

            expect(response.body.message).toBe('Vehicle created successfully');
            expect(response.body.vehicle.make).toBe(testVehicle.make);
            expect(response.body.vehicle.model).toBe(testVehicle.model);
            expect(response.body.vehicle.license_plate).toBe(testVehicle.license_plate);
            expect(response.body.vehicle.id).toBeDefined();
            
            // Store ID for other tests
            testVehicleId = response.body.vehicle.id;
        });

        test('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .send({ make: 'Toyota' }) // Missing other required fields
                .expect(400);

            expect(response.body.error).toBe('All fields are required: customer_id, make, model, year, license_plate');
        });

        test('should return error for non-existent customer', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .send({
                    customer_id: 99999,
                    make: 'Toyota',
                    model: 'Camry',
                    year: 2020,
                    license_plate: 'FAKE-123'
                })
                .expect(404);

            expect(response.body.error).toBe('Customer not found');
        });

        test('should return error for duplicate license plate', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .send(testVehicle) // Same license plate as first test
                .expect(400);

            expect(response.body.error).toBe('Vehicle with this license plate already exists');
        });
    });

    describe('GET /api/vehicles - READ Vehicles', () => {
        test('should get all vehicles with customer info', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .expect(200);

            expect(response.body.message).toBe('Vehicles retrieved successfully');
            expect(response.body.vehicles).toBeInstanceOf(Array);
            expect(response.body.count).toBeGreaterThan(0);
            
            // Check if our test vehicle is included
            const testVeh = response.body.vehicles.find(v => v.id === testVehicleId);
            expect(testVeh).toBeDefined();
            expect(testVeh.customer_name).toBe(testCustomer.name);
        });

        test('should get a vehicle by ID', async () => {
            const response = await request(app)
                .get(`/api/vehicles/${testVehicleId}`)
                .expect(200);

            expect(response.body.message).toBe('Vehicle retrieved successfully');
            expect(response.body.vehicle.make).toBe(testVehicle.make);
            expect(response.body.vehicle.id).toBe(testVehicleId);
            expect(response.body.vehicle.customer_name).toBe(testCustomer.name);
        });

        test('should return 404 for non-existent vehicle', async () => {
            const response = await request(app)
                .get('/api/vehicles/99999')
                .expect(404);

            expect(response.body.error).toBe('Vehicle not found');
        });

        test('should get vehicles by customer ID', async () => {
            const response = await request(app)
                .get(`/api/vehicles/customer/${testCustomerId}`)
                .expect(200);

            expect(response.body.message).toBe('Customer vehicles retrieved successfully');
            expect(response.body.vehicles).toBeInstanceOf(Array);
            expect(response.body.customer_id).toBe(testCustomerId);
            expect(response.body.vehicles.length).toBeGreaterThan(0);
        });
    });

    describe('PUT /api/vehicles/:id - UPDATE Vehicle', () => {
        test('should update a vehicle', async () => {
            const response = await request(app)
                .put(`/api/vehicles/${testVehicleId}`)
                .send(updatedVehicle)
                .expect(200);

            expect(response.body.message).toBe('Vehicle updated successfully');
            expect(response.body.vehicle.model).toBe(updatedVehicle.model);
            expect(response.body.vehicle.year).toBe(updatedVehicle.year);
            expect(response.body.vehicle.license_plate).toBe(updatedVehicle.license_plate);
        });

        test('should return 404 for non-existent vehicle', async () => {
            const response = await request(app)
                .put('/api/vehicles/99999')
                .send(updatedVehicle)
                .expect(404);

            expect(response.body.error).toBe('Vehicle not found');
        });

        test('should return error for invalid customer ID', async () => {
            const invalidVehicle = {
                ...updatedVehicle,
                customer_id: 99999
            };

            const response = await request(app)
                .put(`/api/vehicles/${testVehicleId}`)
                .send(invalidVehicle)
                .expect(404);

            expect(response.body.error).toBe('Customer not found');
        });
    });

    describe('GET /api/vehicles/search/:query - SEARCH Vehicles', () => {
        test('should search vehicles by make', async () => {
            const response = await request(app)
                .get('/api/vehicles/search/Honda')
                .expect(200);

            expect(response.body.message).toBe('Vehicle search completed successfully');
            expect(response.body.vehicles).toBeInstanceOf(Array);
            expect(response.body.searchQuery).toBe('Honda');
            
            // Should find our test vehicle
            const foundVehicle = response.body.vehicles.find(v => v.id === testVehicleId);
            expect(foundVehicle).toBeDefined();
        });

        test('should search vehicles by license plate', async () => {
            const response = await request(app)
                .get(`/api/vehicles/search/${updatedVehicle.license_plate}`)
                .expect(200);

            expect(response.body.vehicles.length).toBeGreaterThan(0);
            expect(response.body.vehicles[0].license_plate).toBe(updatedVehicle.license_plate);
        });

        test('should search vehicles by customer name', async () => {
            const response = await request(app)
                .get('/api/vehicles/search/Vehicle Test')
                .expect(200);

            expect(response.body.vehicles.length).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/vehicles/:id - DELETE Vehicle', () => {
        test('should not delete vehicle with associated services', async () => {
            // First create a service for the vehicle
            const serviceData = {
                vehicle_id: testVehicleId,
                service_date: '2025-06-20',
                description: 'Test service for vehicle',
                cost: 100.00,
                status: 'completed'
            };

            const serviceResponse = await request(app)
                .post('/api/services')
                .send(serviceData)
                .expect(201);

            // Try to delete vehicle with service
            const deleteResponse = await request(app)
                .delete(`/api/vehicles/${testVehicleId}`)
                .expect(400);

            expect(deleteResponse.body.error).toBe('Cannot delete vehicle with associated service records');
            expect(deleteResponse.body.serviceCount).toBe(1);

            // Clean up the service first
            await dbHelpers.run('DELETE FROM services WHERE id = ?', [serviceResponse.body.service.id]);
        });

        test('should delete a vehicle without services', async () => {
            const response = await request(app)
                .delete(`/api/vehicles/${testVehicleId}`)
                .expect(200);

            expect(response.body.message).toBe('Vehicle deleted successfully');
            expect(response.body.deletedVehicle.id).toBe(testVehicleId);
            
            // Clear ID since vehicle is deleted
            testVehicleId = null;
        });

        test('should return 404 for non-existent vehicle', async () => {
            const response = await request(app)
                .delete('/api/vehicles/99999')
                .expect(404);

            expect(response.body.error).toBe('Vehicle not found');
        });
    });

    describe('Vehicle Statistics', () => {
        test('should get vehicle statistics', async () => {
            const response = await request(app)
                .get('/api/vehicles/stats/summary')
                .expect(200);

            expect(response.body.message).toBe('Vehicle statistics retrieved successfully');
            expect(response.body.stats.totalVehicles).toBeGreaterThanOrEqual(0);
            expect(response.body.stats.vehiclesByMake).toBeInstanceOf(Array);
            expect(response.body.stats.averageYear).toBeGreaterThanOrEqual(0);
        });
    });
});