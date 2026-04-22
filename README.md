# IPTV SaaS Backend API

Production-ready IPTV SaaS Control System built with Node.js, Express, MongoDB, and Socket.io.

## Features

✅ **JWT Authentication** - Secure admin/editor login with role-based access control  
✅ **Channel Management** - Full CRUD operations for channels with multiple streaming sources  
✅ **Version Control** - APK versioning with force update capability  
✅ **Device Tracking** - Register and track device usage across regions  
✅ **Dynamic Config** - Toggle features, maintenance mode, and API URLs in real-time  
✅ **Real-time Analytics** - WebSocket-powered live dashboards  
✅ **Redis Caching** - High-performance caching for channels and config  
✅ **Security** - Helmet.js, Rate Limiting, Input Validation  
✅ **Logging** - Winston logger for request and error tracking  
✅ **Error Handling** - Global error handler with proper HTTP status codes  

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Security**: Helmet.js, bcryptjs, express-rate-limit
- **Logging**: Winston

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Redis

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Update environment variables:
```
MONGODB_URI=mongodb://localhost:27017/iptv-saas
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Start MongoDB and Redis services

5. Run server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/users` - Create new user (Admin)

### Channels
- `GET /api/channels` - Get all channels
- `GET /api/channels/:id` - Get single channel
- `POST /api/channels` - Create channel (Admin/Editor)
- `PUT /api/channels/:id` - Update channel (Admin/Editor)
- `DELETE /api/channels/:id` - Delete channel (Admin)
- `POST /api/channels/bulk/update` - Bulk update channels (Admin)

### Configuration
- `GET /api/config` - Get app configuration (Public)
- `PUT /api/config` - Update configuration (Admin)
- `POST /api/config/features/:featureName` - Toggle feature (Admin)
- `POST /api/config/maintenance` - Toggle maintenance mode (Admin)
- `POST /api/config/api-switch` - Switch active API (Admin)

### Devices
- `POST /api/device/register` - Register device
- `GET /api/device` - Get all devices (Admin)
- `GET /api/device/:deviceId` - Get single device
- `POST /api/device/:deviceId/favorites` - Add to favorites
- `POST /api/device/:deviceId/watch-history` - Track watch history
- `GET /api/device/stats/summary` - Get device stats (Admin)

### Versions
- `GET /api/version/latest` - Get latest version
- `GET /api/version` - Get all versions (Admin)
- `POST /api/version` - Create version (Admin)
- `PUT /api/version/:id` - Update version (Admin)
- `GET /api/version/check/:currentVersionCode` - Check for update
- `POST /api/version/:id/download` - Record download

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats (Admin)
- `GET /api/analytics/user-growth` - User growth data (Admin)
- `GET /api/analytics/channel-views` - Channel views (Admin)
- `GET /api/analytics/devices-by-country` - Device stats by country (Admin)
- `GET /api/analytics/devices-by-os` - Device stats by OS (Admin)
- `GET /api/analytics/api-performance` - API performance (Admin)
- `GET /api/analytics/top-errors` - Top errors (Admin)

## Authentication

### Login Request
```json
POST /api/auth/login
{
  "email": "admin@iptv-saas.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "admin@iptv-saas.com",
      "name": "Admin",
      "role": "admin"
    }
  }
}
```

### Protected Route Header
```
Authorization: Bearer <accessToken>
```

## WebSocket Events

### Dashboard Connection
```javascript
const socket = io('http://localhost:5000');
socket.emit('join-dashboard');
socket.on('active-users', (data) => {
  console.log('Active users:', data.count);
});
```

## Project Structure

```
backend/
├── config/
│   ├── db.js           # MongoDB connection
│   └── redis.js        # Redis cache setup
├── models/
│   ├── User.js
│   ├── Channel.js
│   ├── Version.js
│   ├── Config.js
│   ├── Device.js
│   └── RequestLog.js
├── controllers/
│   ├── authController.js
│   ├── channelController.js
│   ├── configController.js
│   ├── deviceController.js
│   ├── versionController.js
│   └── analyticsController.js
├── routes/
│   ├── authRoutes.js
│   ├── channelRoutes.js
│   ├── configRoutes.js
│   ├── deviceRoutes.js
│   ├── versionRoutes.js
│   └── analyticsRoutes.js
├── middleware/
│   ├── auth.js          # JWT authentication
│   ├── logging.js       # Request logging
│   └── errorHandler.js  # Global error handler
├── utils/
│   ├── logger.js        # Winston logger
│   ├── jwt.js           # JWT utilities
│   └── helpers.js       # Helper functions
├── .env.example
├── server.js            # Main server file
└── package.json
```

## Sample Data

### Create Admin User
```bash
curl -X POST http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@iptv-saas.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### Create Channel
```bash
curl -X POST http://localhost:5000/api/channels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sports Channel",
    "category": "Sports",
    "country": "US",
    "description": "Live sports content",
    "sources": [
      {
        "name": "Primary",
        "url": "http://stream.example.com/sports",
        "priority": 1,
        "isActive": true
      }
    ],
    "thumbnail": "https://example.com/sports.jpg"
  }'
```

### Register Device
```bash
curl -X POST http://localhost:5000/api/device/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "unique-device-id",
    "appVersion": "1.0.0",
    "deviceModel": "Samsung Galaxy S21",
    "osVersion": "11",
    "osType": "Android",
    "manufacturer": "Samsung",
    "country": "US"
  }'
```

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "error": "Detailed error info",
  "timestamp": "2024-04-20T10:30:00.000Z"
}
```

## Security Best Practices

✅ JWT token validation on protected routes  
✅ Password hashing with bcryptjs  
✅ SQL injection prevention with Mongoose  
✅ XSS protection with Helmet  
✅ Rate limiting to prevent abuse  
✅ CORS configuration  
✅ Input validation and sanitization  
✅ Account lockout after failed login attempts  

## Performance Optimizations

✅ Redis caching for frequently accessed data  
✅ Request compression with gzip  
✅ Database indexing  
✅ Connection pooling  
✅ Lean queries when possible  
✅ Pagination for large datasets  

## Logging

Logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (error logs only)

## Testing

```bash
npm test
```

## License

MIT

## Support

For issues and questions, contact: support@iptv-saas.com
#   t l x v 1 s  
 