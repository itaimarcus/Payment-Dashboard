# Database Setup Complete! ✅

## What's Running Now

### 1. DynamoDB Local
- **Container**: `payment-dashboard-dynamodb`
- **Status**: Running
- **Port**: 8000
- **Endpoint**: http://localhost:8000

### 2. Backend Server
- **Status**: Running
- **Port**: 3001
- **Endpoint**: http://localhost:3001
- **Mode**: Development with DynamoDB Local

### 3. Database Table: Payments
- **Status**: Created and Active
- **Primary Key**: userId (HASH) + paymentId (RANGE)
- **GSI 1**: StatusIndex (for status filtering)
- **GSI 2**: CreatedAtIndex (for analytics)

## How the Database Works

### Multi-Tenant Architecture (Per-User Data)

Your Payment Dashboard uses a **multi-tenant** database design where:

```
Each User → Sees ONLY Their Own Payments
```

### Example:

```
DynamoDB Table: Payments
├── 👤 User A (auth0|alice123)
│   ├── Payment 1: $100.00 - Invoice #001
│   ├── Payment 2: $250.00 - Invoice #002
│   └── Payment 3: $75.00 - Invoice #003
│
├── 👤 User B (auth0|bob456)
│   ├── Payment 1: $500.00 - Invoice #100
│   └── Payment 2: $125.00 - Invoice #101
│
└── 👤 User C (auth0|charlie789)
    └── Payment 1: $1000.00 - Invoice #200
```

### Key Points:

1. **User Isolation**: 
   - When User A logs in → sees only payments 1, 2, 3
   - When User B logs in → sees only payments 1, 2
   - When User C logs in → sees only payment 1

2. **Security**:
   - Backend enforces user isolation
   - All queries filter by `userId` from Auth0 JWT token
   - No user can access another user's payments

3. **NOT an Admin Dashboard**:
   - This is a personal payment dashboard
   - Each user manages their own payments
   - No "view all users" feature (unless you build one)

## How to Use

### 1. Start the Frontend (if not already running)

```powershell
cd client
npm run dev
```

Open: http://localhost:5173

### 2. Test with Multiple Users

**Step 1**: Login with Auth0 (User #1)
- Create some payments
- View your dashboard
- Note your payments

**Step 2**: Logout and login as a different user (User #2)
- Create different payments
- View dashboard - you'll see DIFFERENT payments
- This proves multi-tenancy works!

### 3. Where to See Data

#### Frontend (User View):
- **Dashboard**: http://localhost:5173
- Shows only YOUR payments
- Filtered automatically by your userId

#### Backend API (Developer View):
- **Health Check**: http://localhost:3001/health
- **List Payments**: GET http://localhost:3001/api/payments (requires Auth0 token)
- **Create Payment**: POST http://localhost:3001/api/payments (requires Auth0 token)

#### Database (Raw Data View):
To see ALL data (all users) in DynamoDB:

```powershell
# Install AWS CLI first (if needed):
# https://aws.amazon.com/cli/

# Set dummy credentials
$env:AWS_ACCESS_KEY_ID="dummy"
$env:AWS_SECRET_ACCESS_KEY="dummy"

# View all tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# View all payments (ALL users - raw data)
aws dynamodb scan --table-name Payments --endpoint-url http://localhost:8000 --region us-east-1

# View specific user's payments
aws dynamodb query --table-name Payments --key-condition-expression "userId = :userId" --expression-attribute-values '{":userId":{"S":"auth0|YOUR_USER_ID"}}' --endpoint-url http://localhost:8000 --region us-east-1
```

## Data Flow Diagram

```
┌─────────────────┐
│  User Logs In   │
│  (Auth0 JWT)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extract userId │
│ from JWT Token  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create Payment │
│  userId: "..."  │
│  amount: 100    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  DynamoDB PutCommand    │
│  Store with userId key  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  List Payments Query    │
│  Filter: userId = "..." │
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  Return ONLY    │
│  User's Payments│
└─────────────────┘
```

## Testing the Implementation

### Test 1: Create Payment (Postman or curl)

```powershell
# Get Auth0 token first, then:
curl http://localhost:3001/api/payments -Method POST -Headers @{
    "Authorization" = "Bearer YOUR_AUTH0_TOKEN"
    "Content-Type" = "application/json"
} -Body '{"amount": 100, "currency": "GBP", "reference": "Test Payment"}'
```

### Test 2: List Payments

```powershell
curl http://localhost:3001/api/payments -Headers @{
    "Authorization" = "Bearer YOUR_AUTH0_TOKEN"
}
```

### Test 3: Frontend UI

1. Go to http://localhost:5173
2. Login with Auth0
3. Click "Create Payment"
4. Fill in details and submit
5. See your payment in the list
6. **The payment is now stored in DynamoDB!**

### Test 4: Verify Persistence

1. Create a payment in the UI
2. Stop the backend server (Ctrl+C)
3. Restart the backend: `npm run dev`
4. Refresh the frontend
5. **Your payment is still there!** (This proves DynamoDB persistence works)

## Environment Variables in Use

```env
# DynamoDB Local Configuration
DYNAMODB_ENDPOINT=http://localhost:8000  # Local endpoint
AWS_REGION=us-east-1                      # Region (any)
AWS_ACCESS_KEY_ID=dummy                   # Dummy credentials for local
AWS_SECRET_ACCESS_KEY=dummy               # Dummy credentials for local
```

## Status Check Commands

```powershell
# Check DynamoDB container
docker ps --filter "name=payment-dashboard-dynamodb"

# Check backend logs
# (View the terminal where npm run dev is running)

# Check if backend is responding
curl http://localhost:3001/health
```

## Next Steps

✅ **Everything is set up!** You can now:

1. **Start using the app**: Login and create payments
2. **Test multi-tenancy**: Login with different Auth0 accounts
3. **View statistics**: Click "Show Statistics" in the dashboard
4. **Search payments**: Use the search bar
5. **Filter by status**: Use the status dropdown

## Troubleshooting

### DynamoDB Not Running
```powershell
docker start payment-dashboard-dynamodb
```

### Backend Not Running
```powershell
cd server
npm run dev
```

### Frontend Not Running
```powershell
cd client
npm run dev
```

### Need to Reinitialize Database
```powershell
cd server
npm run init-db
```

### Clear All Data (Fresh Start)
```powershell
# Stop and remove container
docker stop payment-dashboard-dynamodb
docker rm payment-dashboard-dynamodb

# Start fresh
docker run -d -p 8000:8000 --name payment-dashboard-dynamodb amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory

# Initialize tables
cd server
npm run init-db
```

## Summary

🎉 **Congratulations!** Your Payment Dashboard is now:
- ✅ Using DynamoDB for persistent storage
- ✅ Supporting multi-tenant architecture (per-user data)
- ✅ Fully functional with all CRUD operations
- ✅ Ready for development and testing

**Current Status:**
- 🟢 DynamoDB Local: Running on port 8000
- 🟢 Backend API: Running on port 3001
- 🟢 Payments Table: Created and active
- 🟢 Ready to accept payments!

Happy coding! 🚀
