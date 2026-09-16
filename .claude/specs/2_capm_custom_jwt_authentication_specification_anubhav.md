# Custom JWT Authentication Framework Specification for SAP CAPM with SQLite

## Project Overview

Build a fully custom authentication and authorization framework for a Node.js-based SAP Cloud Application Programming Model (CAPM) application without using XSUAA or standard CAP authentication.

We have already created entities in schema.cds for user, roles and userrole. Also a service is already created, so enhance the same if possible for login flow.

The framework must support:

- Custom login API
- User validation from SQLite database using table Users
- JWT token generation
- JWT token validation middleware
- Automatic attachment of authenticated user to `req.user`
- Role-based authorization using our custom roles in UseRole Table
- Refresh token support
- Password hashing
- Secure API protection
- Fiori Freestyle UI integration
- SQLite database integration using CAP CDS entities

---

# Architecture Flow

```text
Client Application (Fiori/UI5/React)
        ↓
POST /auth/login
        ↓
Validate User from SQLite Database
        ↓
Generate JWT Access Token
        ↓
Return Token to UI
        ↓
UI stores token
        ↓
UI sends token in Authorization Header
        ↓
CAP Middleware validates JWT
        ↓
Attach authenticated user to req.user
        ↓
Protected CAP APIs execute
```

---

# Technology Stack

| Component | Technology |
|---|---|
| Backend Framework | CAPM Node.js |
| Database | SQLite (CAP Default DB) |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Token Library | jsonwebtoken |
| Middleware | Express Middleware |
| Frontend | SAPUI5 Freestyle |
| Runtime | Node.js |

---

# Project Structure

```text
project-root/
│
├── srv/
│   ├── auth/
│   │   ├── auth-service.js
│   │   ├── auth-middleware.js
│   │   ├── token-service.js
│   │   ├── password-service.js
│   │   └── auth-utils.js
│   │
│   ├── handlers/
│   │   └── user-handler.js
│   │
│   ├── server.js
│   └── services.cds
│
├── db/
│   ├── schema.cds
│   ├── data/
│   │   └── seed-users.csv
│   └── sqlite.db
│
├── package.json
├── .env
└── README.md
```

---

# CAP Configuration

## Disable CAP Standard Authentication

Do not Update `package.json`:

As it is already disabled

Framework must NOT use:

- XSUAA
- IAS
- Passport.js
- CAP built-in auth

---

# SQLite Database Tables

## Users Entity

Do not Create CDS entity in `db/schema.cds`

```cds
namespace auth.db;

entity Users {
    key userId             : UUID;
    email                  : String(255);
    mobile                 : String(20);
    passwordHash           : String(500);
    firstName              : String(100);
    lastName               : String(100);
    roles                  : String(500);
    isActive               : Boolean default true;
    failedLoginAttempts    : Integer default 0;
    lastLoginAt            : Timestamp;
    createdAt              : Timestamp;
    updatedAt              : Timestamp;
}
```

---

# Required Features

# 1. Login API

## Endpoint

```http
POST /auth/login
```

## Request Payload

```json
{
  "email": "admin@test.com",
  "password": "Password123"
}
```

## Validation Rules

- Email mandatory
- Password mandatory
- Validate user exists
- Validate user active
- Compare password using bcrypt

---

# 2. Password Hashing

Use bcrypt.

## Requirements

- Salt rounds = 10 minimum
- Password never stored plain text
- Utility function for hashing
- Utility function for comparison

## Example Functions

```js
hashPassword(password)

comparePassword(password, hash)
```

---

# 3. JWT Token Generation

Use `jsonwebtoken`.

## Access Token Payload

```json
{
  "userId": "UUID",
  "email": "admin@test.com",
  "roles": ["ADMIN"],
  "iat": 11111111,
  "exp": 11111111
}
```

## Requirements

- Access token expiry = 1 hour
- Refresh token expiry = 7 days
- Secret key from `.env`
- Separate methods for:
  - generateAccessToken()
  - generateRefreshToken()

---

# 4. Login Response

## Success Response

```json
{
  "success": true,
  "tokenType": "Bearer",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "user": {
    "userId": "UUID",
    "email": "admin@test.com",
    "roles": ["ADMIN"]
  }
}
```

## Failure Response

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

# 5. JWT Authentication Middleware

## Middleware Responsibilities

Middleware must:

- Read Authorization header
- Validate Bearer token
- Verify JWT signature
- Verify token expiry
- Load user from SQLite database
- Reject inactive users
- Attach authenticated user to request

---

# Middleware Behavior

## Valid Token

```js
req.user = {
  userId,
  email,
  roles
}
```

Then call:

```js
next()
```

---

## Invalid Token

Return:

```http
401 Unauthorized
```

Response:

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

# 6. Middleware Registration

In `srv/server.js`

```js
const cds = require('@sap/cds');
const authMiddleware = require('./auth/auth-middleware');

cds.on('bootstrap', app => {

   app.use(authMiddleware);

});

module.exports = cds.server;
```

---

# 7. Public Endpoints

These endpoints must bypass JWT validation:

```text
/auth/login
/auth/refresh-token
/health
```

Middleware must support whitelist logic.

---

# 8. Refresh Token API

## Endpoint

```http
POST /auth/refresh-token
```

## Request

```json
{
  "refreshToken": "token"
}
```

## Response

Generate new access token.

---

# 9. Logout API

## Endpoint

```http
POST /auth/logout
```

## Requirements

- Optional token blacklist support
- Clear refresh token storage
- Stateless JWT logout acceptable

---

# 10. Role-Based Authorization

Framework must support role validation.

## Example

```js
authorize(['ADMIN'])
```

## Behavior

- Verify `req.user.roles`
- Reject unauthorized users

## Unauthorized Response

```http
403 Forbidden
```

```json
{
  "success": false,
  "message": "Access denied"
}
```

---

# 11. CAP Service Integration

Authenticated user must be accessible inside CAP handlers.

## Example

```js
this.on('getProfile', async req => {

   const user = req.user;

});
```

Middleware must ensure compatibility with CAP request lifecycle.

---

# 12. Fiori/UI Requirements

Frontend must:

- Store JWT securely
- Send Bearer token in every request
- Handle token expiration
- Redirect to login if 401 received

## Header Format

```http
Authorization: Bearer <token>
```

---

# 13. Security Requirements

## Mandatory

- Use bcrypt
- Never log passwords
- JWT secret from `.env`
- Validate all inputs
- Sanitize payloads
- Protect against brute force attacks
- Add rate limiting
- Add helmet middleware
- Enable CORS configuration
- Prevent user enumeration

---

# 14. Environment Variables

Create `.env`

```env
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=10
```

---

# 15. NPM Packages

Required dependencies:

```bash
npm install bcrypt jsonwebtoken dotenv helmet cors express-rate-limit
```

---

# 16. CAP Database Access

Use CAP CDS query APIs.

## Example User Fetch

```js
const cds = require('@sap/cds');

const db = await cds.connect.to('db');

const user = await db.run(
  SELECT.one.from('auth.db.Users').where({ email })
);
```

## Example User Update

```js
await db.run(
  UPDATE('auth.db.Users')
    .set({ lastLoginAt: new Date() })
    .where({ userId })
);
```

---

# 17. Error Handling

Framework must support centralized error handling.

## Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "code": "AUTH_ERROR"
}
```

---

# 18. Logging

Use structured logging.

Log:

- Login success
- Login failure
- Token validation failure
- Unauthorized access
- Password reset attempts

Do NOT log:

- Passwords
- JWT tokens
- Secrets

---

# 19. Optional Enhancements

Implement if possible:

- OTP login
- Email verification
- Password reset
- Session management
- Device tracking
- Multi-tenant support
- Audit logs
- RBAC + ABAC
- Dynamic permissions from DB

---

# Deliverables Expected

The implementation must provide:

1. Complete CAPM project structure
2. All middleware files
3. SQLite database integration
4. JWT services
5. Login/logout APIs
6. Refresh token implementation
7. Role authorization middleware
8. Example protected CAP service
9. Example Fiori login integration
10. `.env.example`
11. README with setup instructions
12. Postman collection
13. Sample SQLite seed data

---

# Coding Standards

- Use async/await
- Use modular architecture
- Use ES6 syntax
- Avoid hardcoded secrets
- Add comments
- Follow clean code principles
- Reusable middleware
- Reusable utility services

---

# Expected Outcome

After implementation:

- CAP APIs are protected using custom JWT auth
- Users authenticate via custom login API
- Authenticated user available in `req.user`
- Role-based authorization works
- Frontend can securely consume CAP APIs
- No dependency on XSUAA or CAP standard auth
- SQLite database used through CAP CDS entities

