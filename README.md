## Management Sytem For Grand Auto Garage

# Introduction
This is an information system for Grand Auto Garage, a multi-brand automobile workshop. The objective is to use a frontend and backend which exhibit CRUD functions to digitilize process like managing customer, vehicle and service details. This a web application designed to track and manage vehicles within a garage, providing real-time status updates.

# Features
- CRUD operations for:
  - Customers (name, contact, email, adress)
  - Vehicles (make, model, year, license plate)
  - Service (date, time, type of service)
- Advanced search and filtering features

# Technologies Used
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite

## API Overview

### Customer API

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/api/customers`      | Fetch all customers            |
| GET    | `/api/customers/:id`  | Fetch a specific customer      |
| POST   | `/api/customers`      | Register a new customer        |
| PUT    | `/api/customers/:id`  | Update customer information    |
| DELETE | `/api/customers/:id`  | Delete a customer (with checks)|

### Vehicle API

| Method | Endpoint              | Description                       |
|--------|-----------------------|-----------------------------------|
| GET    | `/api/vehicles`       | Fetch all vehicles                |
| GET    | `/api/vehicles/:id`   | Fetch a specific vehicle          |
| POST   | `/api/vehicles`       | Register a new vehicle            |
| PUT    | `/api/vehicles/:id`   | Update vehicle information        |
| DELETE | `/api/vehicles/:id`   | Delete a vehicle (if no services) |

### Service API

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/services`       | Fetch all service records            |
| GET    | `/api/services/:id`   | Fetch a specific service record      |
| POST   | `/api/services`       | Log a new service                    |
| PUT    | `/api/services/:id`   | Update service record                |
| DELETE | `/api/services/:id`   | Delete a service record (with check) |

## Organization 

### Grand Auto Garage
- Services : 
 - Mechanical
 - Body Work
 - Painting
 - Custom work
 - Detailing

- Googlemap Link : https://maps.app.goo.gl/8MxnnV2TvDhJNQYj7