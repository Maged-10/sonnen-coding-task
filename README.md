# sonnen-coding-task

## I wrote this code in Node.js because it is very popular for API-related tasks and I find myself very comfortable with it. I also chose SQLite for its simplicity and JWT for authentication and authorization because it is straightforward yet effective.

## Overview
- **Register Endpoint (`/register`)**: Registers a moonBattery using its unique MAC address and returns a serial number along with a JWT token.
- **Ping Endpoint (`/ping`)**: Stores the last contact timestamp from the moonBattery.
- **Configurations Endpoint (`/configurations`)**: Allows moonBatteries to update key-value configuration pairs.
- **JWT Authentication**: Ensures secure communication between moonBattery and the backend. The JWT stores the serial number and the device ID of the MoonBattery as claims when first issued.
- **SQLite Database**: Used to store registered batteries, pings, and configurations.

## Security Implementation
- **JWT Tokens**: Each registered moonBattery receives a JWT token. JWT tokens must be used for authentication in `/ping` and `/configurations` requests.
- **Authorization Middleware**: Validation of JWT tokens before allowing access to the protected endpoints.

### Prerequisites
- Node.js (v14 or higher)
- SQLite3

### Running the Project
1. Install dependencies:
   ```sh
   npm install
   ```
2. Set up the environment variables:
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key
   ```
3. Start the SQLite database (it will be created automatically if not present)
4. Run the application:
   ```sh
   npm start
   ```
5. The API will be available at `http://localhost:3000`

### API Endpoints
#### Register a moonBattery
- **Endpoint**: `POST /register`
- **Request Body**:
  ```json
  { "mac_address": "00:1A:2B:3C:4D:5E" }
  ```
- **Response**:
  ```json
  { "serial_number": "123456", "token": "jwt_token" }
  ```

#### Send Ping
- **Endpoint**: `POST /ping`
- **Headers**:
  ```json
  { "Authorization": "Bearer jwt_token" }
  ```
- **Response**:
  ```json
  { "message": "Ping recorded" }
  ```

#### Update Configurations
- **Endpoint**: `POST /configurations`
- **Headers**:
  ```json
  { "Authorization": "Bearer jwt_token" }
  ```
- **Request Body**:
  ```json
  { "setting1": "value1", "setting2": "value2" }
  ```
- **Response**:
  ```json
  { "message": "Configuration updated" }
  ```

## Testing
Run unit tests using Jest:
```sh
npm test
```

## Generate documentation
```sh
npm run docs
```
