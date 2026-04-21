# MongoDB Primary + Supabase Backup Setup

## Overview

Your Folusho Reporting Sheet now routes all API requests to **MongoDB (primary)** with automatic fallback to **Supabase (backup)** if MongoDB becomes unavailable.

## Architecture

```
Frontend (React)
    ↓
API Service with Fallback Logic
    ├─→ Primary: MongoDB (port 3002)
    │   └─→ If fails, automatically switches to:
    └─→ Backup: Supabase (port 3001)
```

## Configuration

### Frontend Environment Variables

**`.env`** (your current setup):
```
VITE_API_URL=http://localhost:3002/api          # MongoDB (Primary)
VITE_BACKUP_API_URL=http://localhost:3001/api   # Supabase (Backup)
```

### Backend Servers

**MongoDB Server** (`/server`):
- Port: `3002`
- Database: MongoDB
- Start: `npm run dev` (from `/server` directory)

**Supabase Server** (`/backend`):
- Port: `3001`
- Database: Supabase
- Start: `npm run dev` (from `/backend` directory)

## How It Works

1. **Primary Request**: All API calls go to MongoDB first
2. **Automatic Fallback**: If MongoDB fails, requests automatically retry on Supabase
3. **Health Monitoring**: Every 30 seconds, the system attempts to reconnect to MongoDB
4. **Transparent Switching**: Users don't see any interruption during failover

## Starting the System

### Option 1: MongoDB Only (Development)
```bash
# Terminal 1: Start MongoDB server
cd server
npm install
npm run dev

# Terminal 2: Start Frontend
cd ..
npm run dev
```

### Option 2: Both Servers (Full Redundancy)
```bash
# Terminal 1: Start MongoDB server
cd server
npm run dev

# Terminal 2: Start Supabase server
cd backend
npm run dev

# Terminal 3: Start Frontend
npm run dev
```

## Monitoring API Status

A debug panel appears in the bottom-right corner of your app showing:
- **Active API**: Which database is currently being used
- **Primary URL**: MongoDB endpoint
- **Backup URL**: Supabase endpoint
- **Retry Status**: When the next retry to primary will occur

Click the database icon to toggle the debug panel.

## Fallback Behavior

### When MongoDB Fails:
1. Request fails on MongoDB
2. System logs warning and switches to Supabase
3. Request retries on Supabase
4. User sees no interruption
5. System marks MongoDB as failed

### Recovery:
- Every 30 seconds, system attempts to reconnect to MongoDB
- If successful, automatically switches back to MongoDB
- All subsequent requests use MongoDB again

## Production Deployment

### MongoDB (Render.com)
```bash
# Set environment variables in Render dashboard:
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/folusho
JWT_SECRET=<your-secret>
FRONTEND_URL=https://your-frontend.vercel.app
```

### Supabase (Backup)
```bash
# Set environment variables in backend:
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-key>
```

### Frontend (Vercel)
```bash
# Set environment variables:
VITE_API_URL=https://your-mongodb-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

## Troubleshooting

### Both APIs Down
- Check MongoDB connection: `mongodb://localhost:27017`
- Check Supabase connection: Verify credentials in `.env`
- Check browser console for detailed error messages

### Stuck on Backup
- MongoDB server may be down
- Check MongoDB logs: `npm run dev` in `/server`
- Restart MongoDB server to trigger reconnection

### API Status Shows Wrong Database
- Refresh the page
- Check browser console for connection errors
- Verify environment variables in `.env`

## Files Modified

- `.env` - Updated API URLs
- `.env.example` - Documented new configuration
- `src/services/apiWithFallback.ts` - New fallback service
- `src/services/api.ts` - Updated to use fallback service
- `src/components/APIStatusDebug.tsx` - New debug component
- `src/App.tsx` - Added debug component

## Reverting to Single API

If you want to use only MongoDB:
1. Remove `VITE_BACKUP_API_URL` from `.env`
2. The system will still work but won't have fallback

If you want to use only Supabase:
1. Change `VITE_API_URL` to Supabase URL
2. Remove `VITE_BACKUP_API_URL`

## Performance Impact

- **Minimal**: Fallback logic only activates on failure
- **No overhead**: Normal requests have no additional latency
- **Automatic recovery**: Transparent to users

## Security Notes

- Both APIs use the same JWT authentication
- Tokens are stored in localStorage
- CORS is configured for both endpoints
- Rate limiting applies to both APIs
