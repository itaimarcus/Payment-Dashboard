# Payment Dashboard with TrueLayer

A full-stack payment management dashboard built with React, TypeScript, Express, and TrueLayer Payments API. This application allows businesses to create, manage, and track payments with real-time status updates and analytics.

## Features

### Core Features

- **Authentication** – Secure login/signup via Auth0
- **Payment list** – All payments with status filtering
- **Create payment links** – Generate TrueLayer payment links
- **Payment details** – View a payment, copy link, retry if failed
- **Status filtering** – Filter by status (e.g. Ready, Completed, Failed)
- **Search** – By reference, amount, or payment ID
- **Analytics** – Payment graphs over 7, 14, or 30 days
- **Status updates** – Sync with TrueLayer when returning from the payment page

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite, CSS modules      |
| **Backend**        | Node.js, Express, TypeScript                 |
| **Database**       | DynamoDB Local (AWS DynamoDB for production) |
| **Authentication** | Auth0                                        |
| **Payments**       | TrueLayer Sandbox API                        |
| **Charts**         | Recharts                                     |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.15.0 or higher recommended)
- **npm** (v9.6.4 or higher)
- **Docker** (for DynamoDB Local)
- **Git**

You'll also need accounts for:

- [Auth0](https://auth0.com) (Free tier)
- [TrueLayer](https://console.truelayer.com) (Sandbox access)

## Quick Start (Docker Compose)

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

### 2. Credentials

You need an [Auth0](https://auth0.com) Single Page Application (callback URL: `http://localhost:5173/callback`) and a [TrueLayer](https://console.truelayer.com) Sandbox application. Put your credentials into the `.env` files when the setup script prompts you, or copy from `client/env.example` and `server/env.example` and fill in the values.

### 3. Run

```bash
# Start all services (DynamoDB, Backend, Frontend)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

### 4. Access the Application

Open your browser to **http://localhost:5173**

All services start together.

### Stop the Application

```bash
# If running in foreground, press Ctrl+C, then:
docker-compose down

# Or directly:
docker-compose down
```

---

## Manual Setup

If you prefer to run services individually without Docker Compose:

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Payment-Dashboard
```

### 2. Credentials and environment

Create an [Auth0](https://auth0.com) Single Page Application and a [TrueLayer](https://console.truelayer.com) Sandbox application. Set Auth0 callback URL to `http://localhost:5173/callback`. Copy `client/env.example` → `client/.env` and `server/env.example` → `server/.env`, then fill in your Auth0 and TrueLayer values. For TrueLayer you also need an ECDSA P-521 signing key (see [TrueLayer signing](https://docs.truelayer.com/docs/signing-requests)).

### 3. Install dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 4. Initialize database

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
Table Payments created successfully
Database initialization complete
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

## API Endpoints

| Method | Endpoint               | Description                                     |
| ------ | ---------------------- | ----------------------------------------------- |
| `POST` | `/api/payments`        | Create a new payment                            |
| `GET`  | `/api/payments`        | List all payments (with optional status filter) |
| `GET`  | `/api/payments/:id`    | Get payment details                             |
| `GET`  | `/api/payments/search` | Search payments by reference/amount             |
| `GET`  | `/api/payments/stats`  | Get payment statistics                          |

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

### 5. CSS modules and design tokens

- **Why**: Scoped styles, shared variables, no extra build dependency
- **Trade-off**: More custom CSS vs utility-first framework

### 6. TypeScript Throughout

- **Why**: Type safety, better IDE support, fewer runtime errors
- **Trade-off**: Initial setup time vs JavaScript

## Security

- Auth0 JWT tokens verified on backend (never trust frontend)
- TrueLayer credentials stored server-side only
- CORS configured for localhost development
- Environment variables for all secrets
- Input validation on both frontend and backend

## A known Limitation

**TrueLayer Sandbox**: Limited to test credentials, not real bank connections

## Troubleshooting

### Docker Compose

Use `docker-compose up` to start, `docker-compose down` to stop, `docker-compose logs` to view logs. See [Docker Compose docs](https://docs.docker.com/compose/) for more.

**Problem:** Backend can't connect to DynamoDB.

**Solution:**

1. Ensure Docker is running.
2. Start DynamoDB: `docker-compose up -d dynamodb`
3. Verify: `docker ps`
4. Initialize DB: `cd server && npm run init-db`
5. Restart backend: `cd server && npm run dev`

### "localhost refused to connect"

**Problem:** App or API doesn't load.

**Solution:**

1. Backend should be on http://localhost:3001, frontend on http://localhost:5173.
2. Start both:
   ```bash
   # Terminal 1
   cd server && npm run dev
   # Terminal 2
   cd client && npm run dev
   ```
3. In Auth0, callback URL must be **http://localhost:5173/callback**.

### Login or payment creation issues

Check your `.env` files and that Auth0 callback URL is `http://localhost:5173/callback`. For TrueLayer, ensure `ec512-private-key.pem` is in `server/` and the signing key ID in `.env` matches the console. See [Auth0](https://auth0.com/docs) and [TrueLayer](https://docs.truelayer.com) docs if needed.

### DynamoDB connection issues

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

### Port already in use

```bash
npx kill-port 3001
npx kill-port 5173
```

## Contact

For questions or feedback, you're welcome to contact me.
