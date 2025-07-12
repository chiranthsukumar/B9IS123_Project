const express = require('express');
const cors = require('cors');
const path = require('path');

const { db } = require('./database');

const customerRoutes = require('./routes/customers');
const vehicleRoutes = require('./routes/vehicles');
const serviceRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);

const server = app.listen(PORT, () => {
    console.log(`Grand Auto Garage API server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
});

