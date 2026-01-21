# Payment Dashboard with TrueLayer

A full-stack payment management dashboard built with React, TypeScript, Express, and TrueLayer Payments API. This application allows businesses to create, manage, and track payments with real-time status updates and analytics.

## Features

### Core Features
- ✅ **Authentication** - Secure login/signup via Auth0
- ✅ **Payment List View** - Display all payments with status filtering
- ✅ **Create Payment Links** - Generate TrueLayer payment links
- ✅ **Payment Details** - View individual payment information
- ✅ **Status Filtering** - Filter payments by status (pending, authorized, executed, failed)

### Bonus Features
- ✅ **Payment Analytics** - Visual graphs showing payment amounts by day
- ✅ **Search Functionality** - Search payments by reference, amount, or ID
- ✅ **Real-time Status Updates** - Automatic status synchronization with TrueLayer

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | DynamoDB Local (AWS DynamoDB for production) |
| **Authentication** | Auth0 |
| **Payments** | TrueLayer Sandbox API |
| **Charts** | Recharts |

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─────────────► Auth0 (Authentication)
       │
       ▼
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Express   │◄──────► Auth0 (Token Verification)
│   Backend   │
└──────┬──────┘
       │
       ├─────────────► TrueLayer API (Payments)
       │
       └─────────────► DynamoDB (Data Storage)
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.15.0 or higher recommended)
- **npm** (v9.6.4 or higher)
- **Docker** (for DynamoDB Local)
- **Git**

You'll also need accounts for:
- [Auth0](https://auth0.com) (Free tier)
- [TrueLayer](https://console.truelayer.com) (Sandbox access)

## 🚀 Quick Start (Docker Compose - Recommended)

The easiest way to run the application is using Docker Compose:

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd Payment-Dashboard

# Run the interactive setup script
# For Mac/Linux:
./setup.sh

# For Windows (PowerShell):
.\setup.ps1
```

The setup script will:
- Check if Docker is installed
- Prompt you for Auth0 credentials
- Prompt you for TrueLayer credentials  
- Create all necessary `.env` files automatically
- Display next steps

### 2. Get Your Credentials

**Auth0** (https://auth0.com):
1. Create a free account and a "Single Page Application"
2. Configure:
   - **Allowed Callback URLs**: `http://localhost:5173/callback`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`
3. Copy your Domain and Client ID

**TrueLayer** (https://console.truelayer.com):
1. Create a free account and a Sandbox Application
2. Copy your Client ID and Client Secret

### 3. Run Everything

```bash
# Start all services (DynamoDB, Backend, Frontend)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

### 4. Access the Application

Open your browser to **http://localhost:5173**

That's it! All services start together automatically.

### Stop the Application

```bash
# If running in foreground, press Ctrl+C, then:
docker-compose down

# Or directly:
docker-compose down
```

---

## 📝 Manual Setup Instructions (Alternative)

If you prefer to run services individually without Docker Compose:

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Payment-Dashboard
```

### 2. Auth0 Setup

1. Go to [auth0.com](https://auth0.com) and create a free account
2. Create a new **Single Page Application**
3. Configure the application:
   - **Allowed Callback URLs**: `http://localhost:5173/callback`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`
4. Note down your:
   - Domain (e.g., `dev-xxxxx.auth0.com`)
   - Client ID

### 3. TrueLayer Setup

1. Go to [console.truelayer.com](https://console.truelayer.com) and sign up
2. Create a new Application in **Sandbox mode**
3. Note down your:
   - Client ID
   - Client Secret
4. Review the [TrueLayer Sandbox Testing Guide](https://docs.truelayer.com/docs/test-users-and-credentials)

### 4. Environment Configuration

<<<<<<< HEAD
#### Client Configuration
=======
# 2. Start DynamoDB Local (only DynamoDB, not all services)
docker-compose up -d dynamodb dynamodb
>>>>>>> a66f519 (Payment DashBoard Application - Final Version)

Create `client/.env` (copy from `client/env.example`):

<<<<<<< HEAD
```env
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://localhost:3001
=======
# 4. Initialize database (REQUIRED - first time only)
cd server
npm run init-db

# 5. Start backend (in one terminal)
cd server
npm run dev

# 6. Start frontend (in another terminal)
# Windows: use --host 0.0.0.0
cd client
npm run dev -- --host 0.0.0.0

# Mac/Linux:
cd client
npm run dev

# 7. Open browser
# Go to the URL shown in terminal (usually http://localhost:5173)
>>>>>>> a66f519 (Payment DashBoard Application - Final Version)
```

#### Server Configuration

Create `server/.env` (copy from `server/env.example`):

```env
PORT=3001
NODE_ENV=development

# Auth0
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://your-auth0-domain.auth0.com/api/v2/

# TrueLayer
TRUELAYER_CLIENT_ID=your-truelayer-client-id
TRUELAYER_CLIENT_SECRET=your-truelayer-client-secret
TRUELAYER_SANDBOX_URL=https://api.truelayer-sandbox.com

# DynamoDB Local
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
```

### 5. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 6. Initialize Database

Start DynamoDB Local (in a separate terminal):

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

Initialize the database tables:

```bash
cd server
npm run init-db
```

You should see:
```
✓ Table Payments created successfully
✓ Database initialization complete!
```

## Running the Application (Manual Method)

**Note**: If you used Docker Compose setup above, skip this section.

You need **3 terminals** to run the full stack manually:

### Terminal 1: DynamoDB Local
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

### Terminal 2: Backend Server
```bash
cd server
npm run dev
```

The server will start at `http://localhost:3001`

### Terminal 3: Frontend Client
```bash
cd client
npm run dev
```

The client will start at `http://localhost:5173`

## Usage Guide

### 1. Sign In
- Navigate to `http://localhost:5173`
- Click "Sign In with Auth0"
- Create an account or log in

### 2. Create a Payment
- Click "Create Payment" button
- Fill in:
  - **Reference**: Payment description (e.g., "Invoice #12345")
  - **Amount**: Payment amount (e.g., 100.00)
  - **Currency**: GBP, EUR, or USD
- Click "Create Payment"
- Copy the payment link to share with customers

### 3. View Payments
- All payments are listed on the dashboard
- Filter by status using the dropdown
- Search by reference, amount, or payment ID
- Click on any payment to view details

### 4. View Analytics
- Click "Show Statistics" to display payment graphs
- View payment trends over 7, 14, or 30 days
- See total payments, total amount, and average amount

## Testing with TrueLayer Sandbox

In sandbox mode, you can test the payment flow:

1. Create a payment in the dashboard
2. Copy the payment link
3. Open the link in a new browser tab
4. Select a test bank from TrueLayer's sandbox
5. Use test credentials provided by TrueLayer
6. Complete the payment flow
7. Return to the dashboard to see the updated status

## Project Structure

```
Payment-Dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── CreatePaymentModal.tsx
│   │   │   ├── PaymentsList.tsx
│   │   │   └── PaymentStats.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── PaymentDetail.tsx
│   │   ├── services/         # API service layer
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── payment.ts
│   │   ├── App.tsx           # Main app with routing
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Tailwind CSS
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Express backend
│   ├── src/
│   │   ├── db/               # Database layer
│   │   │   ├── dynamodb.ts
│   │   │   ├── init.ts
│   │   │   └── payments.repository.ts
│   │   ├── middleware/       # Auth middleware
│   │   │   └── auth.ts
│   │   ├── routes/           # API routes
│   │   │   └── payments.ts
│   │   ├── services/         # Business logic
│   │   │   └── truelayer.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── payment.ts
│   │   └── server.ts         # Express app
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments` | Create a new payment |
| `GET` | `/api/payments` | List all payments (with optional status filter) |
| `GET` | `/api/payments/:id` | Get payment details |
| `GET` | `/api/payments/search` | Search payments by reference/amount |
| `GET` | `/api/payments/stats` | Get payment statistics |

All endpoints require authentication via Auth0 JWT token.

## Key Technical Decisions

### 1. Separate Client/Server Structure
- **Why**: Easier to deploy independently, clear separation of concerns
- **Trade-off**: More complex setup vs monorepo

### 2. DynamoDB Single-Table Design
- **Why**: Efficient queries using composite keys (userId + paymentId)
- **Trade-off**: More complex query patterns vs multiple tables

### 3. JWT Middleware for Authentication
- **Why**: Stateless authentication, highly scalable
- **Trade-off**: Token management complexity vs session-based auth

### 4. Axios Interceptors for API Calls
- **Why**: Automatic token attachment, centralized error handling
- **Trade-off**: Additional abstraction layer vs direct fetch calls

### 5. Tailwind CSS for Styling
- **Why**: Rapid UI development, consistent design system, smaller bundle size
- **Trade-off**: Learning curve vs traditional CSS

### 6. TypeScript Throughout
- **Why**: Type safety, better IDE support, fewer runtime errors
- **Trade-off**: Initial setup time vs JavaScript

## Security Considerations

- ✅ Auth0 JWT tokens verified on backend (never trust frontend)
- ✅ TrueLayer credentials stored server-side only
- ✅ CORS configured for localhost development
- ✅ Environment variables for all secrets
- ✅ Input validation on both frontend and backend

## Known Limitations

1. **Docker Dependency**: Application requires Docker to run (or manual setup of all services)
2. **TrueLayer Sandbox**: Limited to test credentials, not real bank connections
3. **No Webhooks**: Payment status updates require manual refresh (could add TrueLayer webhooks)
4. **Single User Context**: No multi-tenancy support (each user sees only their payments)
5. **No Rate Limiting**: Backend API should implement rate limiting for production

## Future Improvements

- [ ] Add TrueLayer webhooks for real-time payment status updates
- [ ] Implement payment refunds
- [ ] Add email notifications for payment events
- [ ] Export payments to CSV/PDF
- [ ] Multi-currency conversion and display
- [ ] Payment scheduling (future payments)
- [ ] Admin dashboard with user management
- [ ] Integration tests with Jest/Vitest
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline with GitHub Actions

## Troubleshooting

<<<<<<< HEAD
### Docker Compose Commands

```bash
# Start all services
docker-compose up

# Start in detached mode (background)
docker-compose up -d
=======
**User Experience:**
- [ ] Email/SMS notifications for payment events
- [ ] Export payments to CSV/PDF/Excel
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)

**Technical Improvements:**
- [ ] Unit tests (Jest/Vitest)
- [ ] E2E tests (Playwright/Cypress)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production deployment guide (AWS/Vercel)
- [ ] Rate limiting and API throttling
- [ ] Logging and monitoring (Sentry, DataDog)
- [ ] Database migrations
- [ ] Admin dashboard for user management

## 🔧 Troubleshooting

### "Failed to fetch payments" Error

**Problem:** Backend can't connect to DynamoDB

**Solution:**
1. Ensure Docker Desktop is running
2. Start DynamoDB: `docker-compose up -d dynamodb dynamodb`
3. Verify it's running: `docker ps`
4. Initialize database: `cd server && npm run init-db`
5. Restart backend: `cd server && npm run dev`

---

### "localhost refused to connect"

**Problem:** Servers are not running

**Solution:**
1. Check backend is running on http://localhost:3001
2. Check frontend is running on http://localhost:3000
3. Start both:
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   cd client && npm run dev
   ```

---

### Auth0 Login Errors

**Problem:** Can't log in or token errors

**Solution:**
1. Verify `client/.env` has correct Auth0 domain and client ID
2. Check Auth0 callback URLs include `http://localhost:3000`
3. Ensure Auth0 app type is **Single Page Application**
4. Check "Refresh Token" is enabled in Auth0 Grant Types
5. Clear browser cache and localStorage, then log in again

---

### TrueLayer "Invalid Parameters"

**Problem:** Can't create payment

**Solution:**
1. Verify `server/.env` has correct TrueLayer credentials
2. Ensure `ec512-private-key.pem` exists in `server/` folder
3. Check signing key ID matches TrueLayer console
4. **Only use GBP or EUR** (other currencies not supported in sandbox)

---

### Docker Commands

```bash
# Start DynamoDB
docker-compose up -d dynamodb
>>>>>>> a66f519 (Payment DashBoard Application - Final Version)

# Stop all services
docker-compose down

# Stop and remove all volumes (fresh start)
docker-compose down -v

# View logs
docker-compose logs

<<<<<<< HEAD
# View logs for specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs dynamodb

# Rebuild containers after code changes
docker-compose up --build

# Restart a specific service
docker-compose restart backend
=======
# Fresh restart (removes data)
docker-compose down -v
docker-compose up -d dynamodb
>>>>>>> a66f519 (Payment DashBoard Application - Final Version)
```

### DynamoDB Connection Issues
```bash
# Check if DynamoDB Local is running
docker ps | grep dynamodb

# If using Docker Compose
docker-compose ps

# Restart DynamoDB Local (manual method)
docker run -p 8000:8000 amazon/dynamodb-local

# Or restart via Docker Compose
docker-compose restart dynamodb
```

### Auth0 Token Errors
- Verify Auth0 domain and client ID in `.env` files
- Check that callback URLs are configured correctly in Auth0 dashboard
- Clear browser localStorage and try logging in again

### TrueLayer API Errors
- Ensure you're using sandbox credentials
- Verify client ID and secret are correct
- Check TrueLayer API status at [status.truelayer.com](https://status.truelayer.com)

### Port Already in Use
```bash
# Find and kill process on port 3001 (backend)
npx kill-port 3001

# Find and kill process on port 5173 (frontend)
npx kill-port 5173
```

## Development Notes

### What Worked Well
- TypeScript provided excellent type safety across the stack
- Auth0 integration was straightforward with their React SDK
- Tailwind CSS enabled rapid UI development
- DynamoDB local made development easy without AWS setup

### What Was Challenging
- TrueLayer API documentation required careful reading
- Managing JWT tokens between Auth0 and Express
- Handling async token refresh in the frontend
- DynamoDB query patterns with composite keys

### What I Would Do Differently
- Add comprehensive error logging (e.g., Sentry)
- Implement proper loading states for all async operations
- Add unit tests from the start
- Use a monorepo tool like Turborepo for better DX
- Add database migrations for schema changes

## Contributing

This is a coding challenge project. Feel free to fork and modify for your own use.

## License

MIT

## Contact

For questions or feedback, please contact the repository owner.

---

**Built with ❤️ using React, TypeScript, TrueLayer, and Auth0**
