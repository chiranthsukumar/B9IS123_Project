const API_BASE = '/api'

let appData = {
    customers: [],
    vehicles: [],
    services: [],
    currentModule: 'overview',
    currentEditId: null,
    currentEditType: null
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await Promise.all([
            loadCustomersData(),
            loadVehiclesData(),
            loadServicesData()
        ]);

        updateOverviewDashboard();

        // Set today's date as default for service date
        const today = new Date().toISOString().split('T')[0];
        const serviceDateInput = document.getElementById('serviceDate');
        if (serviceDateInput) {
            serviceDateInput.value = today;
        }

        console.log('System initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function switchModule(moduleName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all modules
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    
    // Show selected module
    document.getElementById(`${moduleName}-module`).classList.add('active');
    
    // Update page title
    const titles = {
        overview: 'Dashboard',
        customers: 'Customer Management', 
        vehicles: 'Vehicle Management',
        services: 'Service Management'
    };
    document.getElementById('pageTitle').textContent = titles[moduleName];
    
    // Load module-specific data
    switch(moduleName) {
        case 'overview':
            updateOverviewDashboard();
            break;
        case 'customers':
            displayCustomers();
            break;
        case 'vehicles':
            displayVehicles();
            loadCustomersForSelect();
            break;
        case 'services':
            displayServices();
            loadVehiclesForSelect();
            break;
    }
    
    appData.currentModule = moduleName;
}

async function updateOverviewDashboard() {
    try {
        document.getElementById('totalCustomers').textContent = appData.customers.length;
        document.getElementById('totalServices').textContent = appData.services.length;
        
        const totalRevenue = appData.services.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        
        const recentServices = appData.services.slice(0, 5);
        const recentServicesHtml = recentServices.length > 0 ? 
            recentServices.map(service => `
                <div class="data-item" style="margin-bottom: 1rem; padding: 1rem; border-left: 3px solid #3498db;">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${service.customer_name}</div>
                            <div class="item-subtitle">${service.make} ${service.model}</div>
                        </div>
                        <div class="detail-value">${formatCurrency(service.cost)}</div>
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                        ${service.description} • ${formatDate(service.service_date)}
                    </div>
                </div>
            `).join('') :
            '<div class="empty-state"><p>No services recorded yet.</p></div>';
        
        document.getElementById('recentServicesOverview').innerHTML = recentServicesHtml;
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

async function loadCustomersData() {
    try {
        const data = await apiCall('/customers');
        appData.customers = data.customers;
        return data;
    } catch (error) {
        appData.customers = [];
        throw error;
    }
}

async function loadVehiclesData() {
    try {
        const data = await apiCall('/vehicles');
        appData.vehicles = data.vehicles;
        return data;
    } catch (error) {
        appData.vehicles = [];
        throw error;
    }
}

async function loadServicesData() {
    try {
        const data = await apiCall('/services');
        appData.services = data.services;
        return data;
    } catch (error) {
        appData.services = [];
        throw error;
    }
}

function displayCustomers() {
    const container = document.getElementById('customersDataContainer');
    
    if (appData.customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No customers found</h3>
                <p>Get started by adding your first customer to the system.</p>
                <button class="btn btn-primary" onclick="showCustomerForm()">
                    <i class="fas fa-plus"></i> Add First Customer
                </button>
            </div>
        `;
        return;
    }

  const customersHtml = `
        <div class="data-grid">
            ${appData.customers.map(customer => `
                <div class="data-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${customer.name}</div>
                            <div class="item-subtitle">${customer.phone}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-warning btn-sm" onclick="editCustomer(${customer.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteCustomer(${customer.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="item-details">
                        <div class="detail-item">
                            <div class="detail-label">Email</div>
                            <div class="detail-value">${customer.email || 'Not provided'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Address</div>
                            <div class="detail-value">${customer.address || 'Not provided'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Joined</div>
                            <div class="detail-value">${formatDate(customer.created_date)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = customersHtml;
    
}

function showCustomerForm() {
    document.getElementById('customerForm').style.display = 'block';
    document.getElementById('customerForm').scrollIntoView();
    
    document.querySelector('#customerForm form').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('customerFormTitle').textContent = 'Add Customer';
    
    appData.currentEditId = null;
}

function editCustomer(customerId) {
    const customer = appData.customers.find(c => c.id === customerId);
    if (!customer) return;

    showCustomerForm();
    
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerFormTitle').textContent = 'Edit Customer';
    
    appData.currentEditId = customerId;
}

async function handleCustomerSubmit(event) {
    event.preventDefault();
    
    const customerId = document.getElementById('customerId').value;
    const customerData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value
    };
    
    try {
        if (customerId) {
            await apiCall(`/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData)
            });
            showToast('Customer updated successfully!', 'success');
        } else {
            await apiCall('/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });
            showToast('Customer added successfully!', 'success');
        }
        
        await loadCustomersData();
        displayCustomers();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

async function deleteCustomer(customerId) {
    try {
        await apiCall(`/customers/${customerId}`, { method: 'DELETE' });
        showToast('Customer deleted successfully!', 'success');

        await loadCustomersData();
        displayCustomers();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearchFilter').value.toLowerCase();
    const filtered = appData.customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
    
    // Store original data and temporarily replace for display
    const originalCustomers = appData.customers;
    appData.customers = filtered;
    displayCustomers();
    appData.customers = originalCustomers;
}

function displayVehicles() {
    const container = document.getElementById('vehiclesDataContainer');
    
    if (appData.vehicles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car"></i>
                <h3>No vehicles found</h3>
                <p>Register your first vehicle to get started with vehicle management.</p>
                <button class="btn btn-primary" onclick="showVehicleForm()">
                    <i class="fas fa-plus"></i> Register First Vehicle
                </button>
            </div>
        `;
        return;
    }
    
    const vehiclesHtml = `
        <div class="data-grid">
            ${appData.vehicles.map(vehicle => `
                <div class="data-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${vehicle.make} ${vehicle.model}</div>
                            <div class="item-subtitle">${vehicle.customer_name}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-warning btn-sm" onclick="editVehicle(${vehicle.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteVehicle(${vehicle.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="item-details">
                        <div class="detail-item">
                            <div class="detail-label">Year</div>
                            <div class="detail-value">${vehicle.year}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">License Plate</div>
                            <div class="detail-value">${vehicle.license_plate}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Customer Phone</div>
                            <div class="detail-value">${vehicle.customer_phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Registered</div>
                            <div class="detail-value">${formatDate(vehicle.created_date)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = vehiclesHtml;
}

async function loadCustomersForSelect() {
    if (appData.customers.length === 0) {
        await loadCustomersData();
    }
    
    const select = document.getElementById('vehicleCustomerId');
    if (select) {
        select.innerHTML = '<option value="">Choose a customer...</option>';
        appData.customers.forEach(customer => {
            select.innerHTML += `<option value="${customer.id}">${customer.name} - ${customer.phone}</option>`;
        });
    }
}

function showVehicleForm() {
    document.getElementById('vehicleForm').style.display = 'block';
    document.getElementById('vehicleForm').scrollIntoView();
    
    document.querySelector('#vehicleForm form').reset();
    document.getElementById('vehicleId').value = '';
    document.getElementById('vehicleFormTitle').textContent = 'Add Vehicle';
    
    loadCustomersForSelect();
    appData.currentEditId = null;
}

function hideVehicleForm() {
    document.getElementById('vehicleForm').style.display = 'none';
    appData.currentEditId = null;
}

function editVehicle(vehicleId) {
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    showVehicleForm();
    
    document.getElementById('vehicleId').value = vehicle.id;
    document.getElementById('vehicleCustomerId').value = vehicle.customer_id;
    document.getElementById('vehicleMake').value = vehicle.make;
    document.getElementById('vehicleModel').value = vehicle.model;
    document.getElementById('vehicleYear').value = vehicle.year;
    document.getElementById('vehiclePlate').value = vehicle.license_plate;
    document.getElementById('vehicleFormTitle').textContent = 'Edit Vehicle';
    
    appData.currentEditId = vehicleId;
}

async function handleVehicleSubmit(event) {
    event.preventDefault();
    
    const vehicleId = document.getElementById('vehicleId').value;
    const vehicleData = {
        customer_id: parseInt(document.getElementById('vehicleCustomerId').value),
        make: document.getElementById('vehicleMake').value,
        model: document.getElementById('vehicleModel').value,
        year: parseInt(document.getElementById('vehicleYear').value),
        license_plate: document.getElementById('vehiclePlate').value
    };
    
    try {
        if (vehicleId) {
            await apiCall(`/vehicles/${vehicleId}`, {
                method: 'PUT',
                body: JSON.stringify(vehicleData)
            });
            showToast('Vehicle updated successfully!', 'success');
        } else {
            await apiCall('/vehicles', {
                method: 'POST',
                body: JSON.stringify(vehicleData)
            });
            showToast('Vehicle registered successfully!', 'success');
        }
        
        await loadVehiclesData();
        displayVehicles();
        hideVehicleForm();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

function confirmDeleteVehicle(vehicleId) {
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    showConfirmModal(
        'Delete Vehicle',
        `Are you sure you want to delete "${vehicle.make} ${vehicle.model}" (${vehicle.license_plate})? This action cannot be undone.`,
        () => deleteVehicle(vehicleId)
    );
}

async function deleteVehicle(vehicleId) {
    try {
        await apiCall(`/vehicles/${vehicleId}`, { method: 'DELETE' });
        showToast('Vehicle deleted successfully!', 'success');
        
        await loadVehiclesData();
        displayVehicles();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

function filterVehicles() {
    const searchTerm = document.getElementById('vehicleSearchFilter').value.toLowerCase();
    const filtered = appData.vehicles.filter(vehicle => 
        vehicle.make.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        vehicle.license_plate.toLowerCase().includes(searchTerm) ||
        vehicle.customer_name.toLowerCase().includes(searchTerm)
    );
    
    const originalVehicles = appData.vehicles;
    appData.vehicles = filtered;
    displayVehicles();
    appData.vehicles = originalVehicles;
}

function displayServices() {
    const container = document.getElementById('servicesDataContainer');
    
    if (appData.services.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tools"></i>
                <h3>No services found</h3>
                <p>Add your first service record to start.</p>
                <button class="btn btn-primary" onclick="showServiceForm()">
                    <i class="fas fa-plus"></i> Add First Service
                </button>
            </div>
        `;
        return;
    }
    
    const servicesHtml = `
        <div class="data-grid">
            ${appData.services.map(service => `
                <div class="data-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${service.customer_name}</div>
                            <div class="item-subtitle">${service.make} ${service.model} (${service.license_plate})</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-warning btn-sm" onclick="editService(${service.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteService(${service.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="item-details">
                        <div class="detail-item">
                            <div class="detail-label">Service Date</div>
                            <div class="detail-value">${formatDate(service.service_date)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Cost</div>
                            <div class="detail-value">${formatCurrency(service.cost)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">
                                <span class="status-badge status-${service.status}">${service.status}</span>
                            </div>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <div class="detail-label">Description</div>
                            <div class="detail-value">${service.description}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = servicesHtml;
}

async function loadVehiclesForSelect() {
    if (appData.vehicles.length === 0) {
        await loadVehiclesData();
    }
    
    const select = document.getElementById('serviceVehicleId');
    if (select) {
        select.innerHTML = '<option value="">Choose a vehicle...</option>';
        appData.vehicles.forEach(vehicle => {
            select.innerHTML += `<option value="${vehicle.id}">${vehicle.customer_name} - ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</option>`;
        });
    }
}

function showServiceForm() {
    document.getElementById('serviceForm').style.display = 'block';
    document.getElementById('serviceForm').scrollIntoView();
    
    document.querySelector('#serviceForm form').reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceFormTitle').textContent = 'Add Service';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('serviceDate').value = today;
    
    loadVehiclesForSelect();
    appData.currentEditId = null;
}

function hideServiceForm() {
    document.getElementById('serviceForm').style.display = 'none';
    appData.currentEditId = null;
}

function editService(serviceId) {
    const service = appData.services.find(s => s.id === serviceId);
    if (!service) return;
    
    showServiceForm();
    
    document.getElementById('serviceId').value = service.id;
    document.getElementById('serviceVehicleId').value = service.vehicle_id;
    document.getElementById('serviceDate').value = service.service_date;
    document.getElementById('serviceDescription').value = service.description;
    document.getElementById('serviceCost').value = service.cost;
    document.getElementById('serviceStatus').value = service.status;
    document.getElementById('serviceFormTitle').textContent = 'Edit Service';
    
    appData.currentEditId = serviceId;
}

async function handleServiceSubmit(event) {
    event.preventDefault();
    
    const serviceId = document.getElementById('serviceId').value;
    const serviceData = {
        vehicle_id: parseInt(document.getElementById('serviceVehicleId').value),
        service_date: document.getElementById('serviceDate').value,
        description: document.getElementById('serviceDescription').value,
        cost: parseFloat(document.getElementById('serviceCost').value),
        status: document.getElementById('serviceStatus').value
    };
    
    try {
        if (serviceId) {
            await apiCall(`/services/${serviceId}`, {
                method: 'PUT',
                body: JSON.stringify(serviceData)
            });
            showToast('Service record updated successfully!', 'success');
        } else {
            await apiCall('/services', {
                method: 'POST',
                body: JSON.stringify(serviceData)
            });
            showToast('Service record added successfully!', 'success');
        }
        
        await loadServicesData();
        displayServices();
        hideServiceForm();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

function confirmDeleteService(serviceId) {
    const service = appData.services.find(s => s.id === serviceId);
    if (!service) return;
    
    showConfirmModal(
        'Delete Service Record',
        `Are you sure you want to delete this service record for "${service.customer_name}"? This action cannot be undone.`,
        () => deleteService(serviceId)
    );
}

async function deleteService(serviceId) {
    try {
        await apiCall(`/services/${serviceId}`, { method: 'DELETE' });
        showToast('Service record deleted successfully!', 'success');
        
        await loadServicesData();
        displayServices();
        updateOverviewDashboard();
        
    } catch (error) {
    }
}

function filterServices() {
    const searchTerm = document.getElementById('serviceSearchFilter').value.toLowerCase();
    const statusFilter = document.getElementById('serviceStatusFilter').value;
    
    let filtered = appData.services.filter(service => {
        const matchesSearch = service.description.toLowerCase().includes(searchTerm) ||
                             service.customer_name.toLowerCase().includes(searchTerm) ||
                             service.make.toLowerCase().includes(searchTerm) ||
                             service.model.toLowerCase().includes(searchTerm) ||
                             service.license_plate.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || service.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    const originalServices = appData.services;
    appData.services = filtered;
    displayServices();
    appData.services = originalServices;
}

function globalSearch() {
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
    if (searchTerm.length < 2) return;
    
    switch(appData.currentModule) {
        case 'customers':
            document.getElementById('customerSearchFilter').value = searchTerm;
            filterCustomers();
            break;
        case 'vehicles':
            document.getElementById('vehicleSearchFilter').value = searchTerm;
            filterVehicles();
            break;
        case 'services':
            document.getElementById('serviceSearchFilter').value = searchTerm;
            filterServices();
            break;
    }
}