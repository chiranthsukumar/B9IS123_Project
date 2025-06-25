import express from 'express';

const route = express.Router();

const customer = [
    {
        "id": 1,
        "name": "Eva John",
        "phone": "89566272",
        "email": "eva@example.com",
        "vehicle_number": "KL-13-AB-1234",
        "vehicle_model": "Honda City"
    },
    {
        "id": 2,
        "name": "John Doe",
        "phone": "464957648",
        "email": "Johniie@example.com",
        "vehicle_number": "KL-02-B-005",
        "vehicle_model": "Toyota Innova"
    },
    {
        "id": 3,
        "name": "Nithin K",
        "phone": "957564398",
        "email": "nithin34@gmail.com",
        "vehicle_number": "KL-07-L-8978",
        "vehicle_model": "Honda Civic"
    },
    {
        "id": 4,
        "name": "Eva Maria",
        "phone": "859575849",
        "email": "mariaeva@gmail.com",
        "vehicle_number": "KL-59-AA-2341",
        "vehicle_model": "Volkswagon Golf"
    },
    {
        "id": 5,
        "name": "Bhagath Sharma",
        "phone": "857564839",
        "email": "bhagath696969696969@yahoo.com",
        "vehicle_number": "KL-01-CP-1234",
        "vehicle_model": "Suzuki Alto"
    }
]

route.get('/', (req, res) =>{
    res.send(customer);
});

export default route