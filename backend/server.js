const express = require('express');
const cors = require('cors');
const path = require('path');

const { db } = require('./database');

const customerRoutes = require('./routes/customers');
const vehicleRoutes = require('./routes/vehicles');
const serviceRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
