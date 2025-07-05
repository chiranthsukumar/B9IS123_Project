let appData = {
    customers: [],
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await Promise.all([
            loadCustomersData(),
        ]);
        console.log('System initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
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
      <p><strong>No customers found.</strong></p>
      <p>Add your first customer.</p>
      <button onclick="showCustomerForm()">Add Customer</button>
    `;
    return;
  }
    
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