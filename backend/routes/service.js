import express from 'express';
 
const route = express.Router();

const services = [
    {
        "id": 1,
        "name": "Exterior Wash",
        "price": 500
 
    },
    {
        "id": 2,
        "name": "Body Work",
        "price": 2000
 
    },
    {
        "id": 3,
        "name": "Maintanence",
        "price": 1500
 
    },
    {
        "id": 4,
        "name": "Custom works",
        "price": 3000
 
    },
]

route.get('/', (req, res) =>{
    res.send(services);
});

export default route