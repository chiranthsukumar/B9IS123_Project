const express = require('express');
const cors = require('cors');
const path = require('path');

const { db } = require('./database');

const customerRoutes = require('./routes/customer');
const vehicleRoutes = require('./routes/vehicle');
const serviceRoutes = require('./routes/service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check for API endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Grand Auto Garage API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl 
    });
});

// Error handler for middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

const server = app.listen(PORT, () => {
    console.log(`Grand Auto Garage API server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log(`API endpoints at: http://localhost:${PORT}/api/`);
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

module.exports = app;