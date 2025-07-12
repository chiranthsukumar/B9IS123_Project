const request = require('supertest');
const app = require('../server');
const { dbHelpers } = require('../database');

describe('Integration Tests - Frontend to Backend Flow', () => {
    let customerId, vehicleId, serviceId;

    // Clean up test data after all tests
    afterAll(async () => {
        if (serviceId) {
            try {
                await dbHelpers.run('DELETE FROM services WHERE id = ?', [serviceId]);
            } catch (error) {
                console.log('Service already deleted or not found');
            }
        }
        if (vehicleId) {
            try {
                await dbHelpers.run('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
            } catch (error) {
                console.log('Vehicle already deleted or not found');
            }
        }
        if (customerId) {
            try {
                await dbHelpers.run('DELETE FROM customers WHERE id = ?', [customerId]);
            } catch (error) {
                console.log('Customer already deleted or not found');
            }
        }
    });

    test('Complete Workflow: Create Customer -> Add Vehicle -> Add Service -> Retrieve Data', async () => {
        // Step 1: Create a customer (simulating frontend form submission)
        console.log('Step 1: Creating customer...');
        const customerData = {
            name: 'Alice Johnson',
            phone: '555-0123',
            email: 'alice@email.com',
            address: '789 Pine St, Dublin'
        };

        const customerResponse = await request(app)
            .post('/api/customers')
            .send(customerData)
            .expect(201);

        expect(customerResponse.body.customer.name).toBe(customerData.name);
        customerId = customerResponse.body.customer.id;
        console.log(`✓ Customer created with ID: ${customerId}`);

        // Step 2: Add a vehicle for this customer
        console.log('Step 2: Registering vehicle...');
        const vehicleData = {
            customer_id: customerId,
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            license_plate: 'INT-123'
        };

        const vehicleResponse = await request(app)
            .post('/api/vehicles')
            .send(vehicleData)
            .expect(201);

        expect(vehicleResponse.body.vehicle.make).toBe(vehicleData.make);
        expect(vehicleResponse.body.vehicle.customer_id).toBe(customerId);
        vehicleId = vehicleResponse.body.vehicle.id;
        console.log(`✓ Vehicle registered with ID: ${vehicleId}`);

        // Step 3: Add a service record for this vehicle
        console.log('Step 3: Creating service record...');
        const serviceData = {
            vehicle_id: vehicleId,
            service_date: '2025-06-20',
            description: 'Oil change and tire rotation',
            cost: 85.50,
            status: 'completed'
        };

        const serviceResponse = await request(app)
            .post('/api/services')
            .send(serviceData)
            .expect(201);

        expect(serviceResponse.body.service.description).toBe(serviceData.description);
        expect(serviceResponse.body.service.vehicle_id).toBe(vehicleId);
        serviceId = serviceResponse.body.service.id;
        console.log(`✓ Service record created with ID: ${serviceId}`);

        // Step 4: Retrieve complete service record with customer and vehicle info
        console.log('Step 4: Verifying data relationships...');
        const fullServiceResponse = await request(app)
            .get(`/api/services/${serviceId}`)
            .expect(200);

        const service = fullServiceResponse.body.service;
        
        // Verify the complete data chain is working
        expect(service.customer_name).toBe(customerData.name);
        expect(service.make).toBe(vehicleData.make);
        expect(service.model).toBe(vehicleData.model);
        expect(service.description).toBe(serviceData.description);
        expect(service.cost).toBe(serviceData.cost);
        console.log('✓ Data relationships verified');

        // Step 5: Test search functionality (simulating frontend search)
        console.log('Step 5: Testing search functionality...');
        const searchResponse = await request(app)
            .get('/api/customers/search/Alice')
            .expect(200);

        expect(searchResponse.body.customers.length).toBeGreaterThan(0);
        expect(searchResponse.body.customers[0].name).toContain('Alice');
        console.log('✓ Customer search working');

        // Step 6: Test customer's vehicle history
        const vehicleHistoryResponse = await request(app)
            .get(`/api/vehicles/customer/${customerId}`)
            .expect(200);

        expect(vehicleHistoryResponse.body.vehicles.length).toBe(1);
        expect(vehicleHistoryResponse.body.vehicles[0].make).toBe(vehicleData.make);
        console.log('✓ Vehicle history retrieval working');

        // Step 7: Test service statistics (dashboard data)
        const statsResponse = await request(app)
            .get('/api/services/stats/summary')
            .expect(200);

        expect(statsResponse.body.stats.totalServices).toBeGreaterThan(0);
        expect(statsResponse.body.stats.totalRevenue).toBeGreaterThan(0);
        console.log('✓ Service statistics working');

        console.log('✅ Complete workflow test passed!');
    });

    test('Frontend-Backend API Communication', async () => {
        // Test that API endpoints respond correctly for frontend AJAX calls
        console.log('Testing API health check...');
        const healthResponse = await request(app)
            .get('/api/health')
            .expect(200);

        expect(healthResponse.body.status).toBe('OK');
        expect(healthResponse.body.message).toBe('Grand Auto Garage API is running');
        expect(healthResponse.body.timestamp).toBeDefined();
        console.log('✓ API health check working');

        // Test that frontend static files are served
        console.log('Testing frontend file serving...');
        const frontendResponse = await request(app)
            .get('/')
            .expect(200);

        expect(frontendResponse.type).toBe('text/html');
        console.log('✓ Frontend files served correctly');
    });

    test('Database Relationship Integrity', async () => {
        console.log('Testing database relationship constraints...');
        
        // Try to create a vehicle with non-existent customer
        const invalidVehicleData = {
            customer_id: 99999,
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            license_plate: 'REL-789'
        };

        const vehicleResponse = await request(app)
            .post('/api/vehicles')
            .send(invalidVehicleData)
            .expect(404);

        expect(vehicleResponse.body.error).toBe('Customer not found');
        console.log('✓ Customer-Vehicle relationship enforced');

        // Try to create a service with non-existent vehicle
        const invalidServiceData = {
            vehicle_id: 99999,
            service_date: '2025-06-20',
            description: 'Invalid service',
            cost: 100.00,
            status: 'completed'
        };

        const serviceResponse = await request(app)
            .post('/api/services')
            .send(invalidServiceData)
            .expect(404);

        expect(serviceResponse.body.error).toBe('Vehicle not found');
        console.log('✓ Vehicle-Service relationship enforced');
    });

    test('Error Handling Across System', async () => {
        console.log('Testing system error handling...');
        
        // Test 404 for non-existent API endpoint
        const notFoundResponse = await request(app)
            .get('/api/nonexistent')
            .expect(404);

        expect(notFoundResponse.body.error).toBe('API endpoint not found');
        console.log('✓ 404 error handling working');

        // Test validation errors
        const invalidCustomer = {
            name: '', // Empty name
            phone: '' // Empty phone
        };

        const validationResponse = await request(app)
            .post('/api/customers')
            .send(invalidCustomer)
            .expect(400);

        expect(validationResponse.body.error).toBe('Name and phone are required');
        console.log('✓ Data validation working');
    });

    test('Search Functionality Integration', async () => {
        console.log('Testing integrated search functionality...');
        
        // Create test data for comprehensive search testing
        const searchCustomer = {
            name: 'Search Test Customer',
            phone: '555-SEARCH',
            email: 'search@test.com',
            address: 'Search Address'
        };

        const custResponse = await request(app)
            .post('/api/customers')
            .send(searchCustomer)
            .expect(201);

        const searchCustomerId = custResponse.body.customer.id;

        const searchVehicle = {
            customer_id: searchCustomerId,
            make: 'SearchMake',
            model: 'SearchModel',
            year: 2021,
            license_plate: 'SEARCH-1'
        };

        const vehResponse = await request(app)
            .post('/api/vehicles')
            .send(searchVehicle)
            .expect(201);

        const searchVehicleId = vehResponse.body.vehicle.id;

        const searchService = {
            vehicle_id: searchVehicleId,
            service_date: '2025-06-20',
            description: 'Search test service description',
            cost: 99.99,
            status: 'completed'
        };

        const servResponse = await request(app)
            .post('/api/services')
            .send(searchService)
            .expect(201);

        const searchServiceId = servResponse.body.service.id;

        // Test customer search
        const customerSearchResponse = await request(app)
            .get('/api/customers/search/Search')
            .expect(200);

        expect(customerSearchResponse.body.customers.length).toBeGreaterThan(0);
        console.log('✓ Customer search integration working');

        // Test vehicle search
        const vehicleSearchResponse = await request(app)
            .get('/api/vehicles/search/SearchMake')
            .expect(200);

        expect(vehicleSearchResponse.body.vehicles.length).toBeGreaterThan(0);
        console.log('✓ Vehicle search integration working');

        // Test service search
        const serviceSearchResponse = await request(app)
            .get('/api/services/search/Search')
            .expect(200);

        expect(serviceSearchResponse.body.services.length).toBeGreaterThan(0);
        console.log('✓ Service search integration working');

        // Clean up search test data
        await dbHelpers.run('DELETE FROM services WHERE id = ?', [searchServiceId]);
        await dbHelpers.run('DELETE FROM vehicles WHERE id = ?', [searchVehicleId]);
        await dbHelpers.run('DELETE FROM customers WHERE id = ?', [searchCustomerId]);
        console.log('✓ Search test cleanup completed');
    });

    test('Data Persistence and Retrieval', async () => {
        console.log('Testing data persistence across operations...');
        
        // Create, update, and verify data persistence
        const persistTestCustomer = {
            name: 'Persist Test Customer',
            phone: '555-PERSIST',
            email: 'persist@test.com',
            address: 'Persist Address'
        };

        const custResponse = await request(app)
            .post('/api/customers')
            .send(persistTestCustomer)
            .expect(201);

        const persistCustomerId = custResponse.body.customer.id;

        // Update customer
        const updatedCustomerData = {
            name: 'Updated Persist Customer',
            phone: '555-UPDATED',
            email: 'updated@test.com',
            address: 'Updated Address'
        };

        await request(app)
            .put(`/api/customers/${persistCustomerId}`)
            .send(updatedCustomerData)
            .expect(200);

        // Verify update persisted
        const getResponse = await request(app)
            .get(`/api/customers/${persistCustomerId}`)
            .expect(200);

        expect(getResponse.body.customer.name).toBe(updatedCustomerData.name);
        expect(getResponse.body.customer.phone).toBe(updatedCustomerData.phone);
        console.log('✓ Data persistence verified');

        // Clean up
        await dbHelpers.run('DELETE FROM customers WHERE id = ?', [persistCustomerId]);
    });

    test('System Performance and Response Times', async () => {
        console.log('Testing system performance...');
        
        const startTime = Date.now();
        
        // Test multiple rapid API calls
        const promises = [
            request(app).get('/api/customers'),
            request(app).get('/api/vehicles'),
            request(app).get('/api/services'),
            request(app).get('/api/health')
        ];

        await Promise.all(promises);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Should complete within reasonable time (less than 5 seconds)
        expect(totalTime).toBeLessThan(5000);
        console.log(`✓ System performance test completed in ${totalTime}ms`);
    });
});