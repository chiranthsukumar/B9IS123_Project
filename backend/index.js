import express from 'express';
import bodyParser from 'body-parser';
import serviceroute from './routes/service.js';
import customerroute from './routes/customer.js';
const app = express();
const PORT = 5000

app.use(bodyParser.json());
app.use('/service', serviceroute);
app.use('/customer', customerroute);


app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));