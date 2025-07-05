let appData = {
    customers: [],
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
        ]);

        updateOverviewDashboard();

        console.log('System initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
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
        
    } catch (error) {
    }
}