# Render.com Backend Optimization Guide

To make your MongoDB backend on Render "fail-proof" and highly reliable, follow these dashboard settings:

## 1. Configure Health Check
Render uses this to know if your app is running correctly. If the health check fails, Render will automatically restart your server.
- **Path**: `/api/health`
- **Initial Delay**: `20` seconds (to allow MongoDB to connect)

## 2. Environment Variable Validation
Ensure the following variables are set in your Render dashboard (Environment tab):
- `NODE_ENV`: `production`
- `MONGO_URI`: Your MongoDB Atlas connection string
- `CORS_ORIGIN`: `https://your-app-name.vercel.app`
- `JWT_SECRET`: A long, random string
- `PORT`: `10000` (Render's default)

## 3. MongoDB Atlas Whitelisting
- Ensure your MongoDB Atlas cluster has **IP Whitelisting** set to `0.0.0.0/0` (Allow Access from Anywhere). Render IPs are dynamic and change frequently.

## 4. Prevent "Sleep" (For Free Tier)
If you are on the **Free Tier**, Render puts your app to sleep after 15 minutes of inactivity. 
- **The Symptom**: The first user of the day waits 30 seconds for the app to wake up.
- **The Fix**: Use a free cron job service like [Cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/) to ping `https://your-backend.onrender.com/api/health` every 10 minutes. This keeps it "awake" 24/7.

## 5. Graceful Shutdown (Already Implemented)
The code now handles `SIGTERM` signals from Render. When you deploy a new version, Render will:
1. Send a signal to your app.
2. Your app will stop accepting new requests.
3. Your app will close the MongoDB connection properly.
4. Your app will shut down safely.
*This prevents data corruption during deployments.*

## 6. Auto-Restart on Memory Leaks
Render's runtime monitors your memory usage. If your app ever leaks memory and hits the limit, Render will restart it. The code is optimized with `compression` to keep the memory footprint low.
