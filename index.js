import express from 'express';
import bodyParser from 'body-parser';
import route from './routes/service.js'

const app = express();
const PORT = 5000

app.use(bodyParser.json());
app.use('/service', route);

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`)); 