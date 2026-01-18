# Quick Start Guide - Docker Compose Edition

Get the Payment Dashboard up and running with **one command**!

## Prerequisites Checklist

- [ ] Docker installed and running
- [ ] Auth0 account created
- [ ] TrueLayer account created (Sandbox)

## Super Quick Setup (3 Steps)

### Step 1: Get Your Credentials (5 min)

**Auth0** (https://auth0.com):
1. Create a Single Page Application
2. Set Callback URL: `http://localhost:5173/callback`
3. Set Logout URL: `http://localhost:5173`
4. Set Web Origin: `http://localhost:5173`
5. Copy **Domain** and **Client ID**

**TrueLayer** (https://console.truelayer.com):
1. Create a Sandbox Application
2. Copy **Client ID** and **Client Secret**

### Step 2: Run Setup Script (2 min)

**Mac/Linux:**
```bash
./setup.sh
```

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

The script will:
- ✅ Check Docker installation
- ✅ Prompt for Auth0 credentials
- ✅ Prompt for TrueLayer credentials
- ✅ Create `.env` files automatically
- ✅ Show you what to do next

### Step 3: Start Everything (1 command!)

```bash
docker-compose up
```

That's it! Open **http://localhost:5173** 🎉

## What Just Happened?

Docker Compose automatically:
1. ✅ Started DynamoDB Local
2. ✅ Built and started the backend server
3. ✅ Built and started the frontend
4. ✅ Initialized the database tables
5. ✅ Connected everything together

All services are running and ready to use!

## Daily Usage

```bash
# Start the app
docker-compose up

# Stop the app
docker-compose down

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f
```

## First Steps After Login

1. **Create a Payment**
   - Click "Create Payment" button
   - Fill in: Reference, Amount (e.g., 100.00), Currency (GBP)
   - Get your payment link!

2. **View Your Payments**
   - See all payments in the dashboard
   - Try the search bar
   - Filter by status

3. **View Analytics**
   - Click "Show Statistics"
   - See your payment trends

## Helpful Commands

```bash
# Fresh start (removes all data)
docker-compose down -v
docker-compose up

# Rebuild after making code changes
docker-compose up --build

# View logs for one service
docker-compose logs backend
docker-compose logs frontend

# Restart just one service
docker-compose restart backend
```

## Troubleshooting

**"Port already in use"?**
```bash
docker-compose down
# Then try again
docker-compose up
```

**"Cannot connect to Docker"?**
- Make sure Docker Desktop is running
- On Windows: Check Docker Desktop is not stuck updating

**Auth0 errors?**
- Double-check domain and client ID in Auth0 dashboard
- Verify callback URLs are exact: `http://localhost:5173/callback`
- Clear browser cache and try again

**Want to start fresh?**
```bash
# This removes all data and containers
docker-compose down -v
./setup.sh  # Run setup again
docker-compose up
```

## Manual Method (If You Prefer)

Don't want Docker Compose? See the full [README.md](README.md) for manual setup instructions with 3 separate terminals.

---

## Comparison: Before vs After

### Before (Manual Setup)
1. Clone repo
2. Create Auth0 app
3. Create TrueLayer app
4. Manually create `client/.env`
5. Manually create `server/.env`
6. `cd client && npm install`
7. `cd server && npm install`
8. Terminal 1: `docker run -p 8000:8000 amazon/dynamodb-local`
9. Terminal 2: `cd server && npm run init-db && npm run dev`
10. Terminal 3: `cd client && npm run dev`

**Time: ~15-20 minutes** ⏱️

### Now (Docker Compose)
1. Clone repo
2. Create Auth0 app
3. Create TrueLayer app
4. `./setup.sh` (enters credentials)
5. `docker-compose up`

**Time: ~5 minutes** ⏱️🚀

---

**Need help?** Check the full documentation in [README.md](README.md)

Happy coding! 🎉
