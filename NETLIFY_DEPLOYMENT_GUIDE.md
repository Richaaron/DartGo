# Netlify Deployment Guide - Folusho Reporting Sheet

## Overview

This guide will help you deploy your Folusho Reporting Sheet frontend to Netlify and backend to Render.

**Architecture**:
- **Frontend**: Netlify (React + Vite)
- **Backend**: Render (Node.js + MongoDB)
- **Database**: MongoDB Atlas
- **Backup**: Supabase

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with your code pushed
- [ ] Netlify account (free at https://netlify.com)
- [ ] Render account (free at https://render.com)
- [ ] MongoDB Atlas account (free at https://mongodb.com/cloud/atlas)
- [ ] Gmail account with app password

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Fill in details:
   - **Name**: `folusho-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for production)

### Step 3: Add Environment Variables
In Render dashboard, go to your service → Environment:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/folusho
PORT=3002
JWT_SECRET=your-very-long-secret-key-at-least-32-characters
FRONTEND_URL=https://your-netlify-site.netlify.app
CORS_ORIGIN=https://your-netlify-site.netlify.app
NODE_ENV=production
LOG_LEVEL=info
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=folushovictoryschool@gmail.com
SMTP_PASS=fvvv lyzz hdsd aupi
SMTP_FROM=folushovictoryschool@gmail.com
JWT_EXPIRY=7d
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MS=900000
SESSION_TIMEOUT_MS=86400000
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://folusho-backend.onrender.com`

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub
3. Authorize Netlify to access your repositories

### Step 2: Connect Repository
1. Click "Add new site" → "Import an existing project"
2. Select GitHub
3. Choose your repository
4. Click "Install"

### Step 3: Configure Build Settings
Netlify should auto-detect:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

If not, set them manually:
1. Go to Site settings → Build & deploy → Build settings
2. Update if needed

### Step 4: Add Environment Variables
1. Go to Site settings → Build & deploy → Environment
2. Add these variables:

```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

### Step 5: Deploy
1. Click "Deploy site"
2. Wait for build (2-5 minutes)
3. Your site will be live at: `https://your-site-name.netlify.app`

---

## Part 3: Configure Custom Domain (Optional)

### Add Custom Domain to Netlify
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `folusho.com`)
4. Follow DNS configuration steps
5. Netlify provides free SSL certificate

---

## Part 4: Set Up Monitoring & Alerts

### Netlify Monitoring
1. Go to Analytics → Netlify Analytics
2. Monitor traffic and performance
3. Set up notifications for build failures

### Render Monitoring
1. Go to your service → Metrics
2. Monitor CPU, memory, and requests
3. Set up alerts for high usage

### UptimeRobot (Keep Backend Awake)
1. Go to https://uptimerobot.com
2. Create monitor for: `https://folusho-backend.onrender.com/api/health`
3. Set interval to 5 minutes

---

## Part 5: Verify Deployment

### Test Frontend
1. Go to your Netlify URL
2. Try logging in with test credentials
3. Create a student
4. Check if email is sent
5. View results

### Test Backend
```bash
curl https://folusho-backend.onrender.com/api/health
# Should return: {"status":"ok"}
```

### Test API Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform an action (create student, etc.)
4. Check API calls are going to Render backend
5. Check API Status debug panel (bottom-right)

---

## Troubleshooting

### Build Fails on Netlify

**Error**: `npm ERR! code ERESOLVE`

**Solution**:
1. Go to Site settings → Build & deploy → Build settings
2. Add environment variable: `NPM_FLAGS=--legacy-peer-deps`
3. Redeploy

### API Calls Failing

**Error**: `Failed to fetch from API`

**Solution**:
1. Check backend is running on Render
2. Verify `VITE_API_URL` is correct in Netlify environment
3. Check CORS is configured in backend
4. Check API Status debug panel for which API is active

### Email Not Sending

**Error**: `Failed to send email`

**Solution**:
1. Verify Gmail app password in Render environment
2. Check Gmail account has 2FA enabled
3. Verify SMTP credentials are correct
4. Check email logs in MongoDB

### Session Timeout Not Working

**Error**: `User stays logged in forever`

**Solution**:
1. Check browser console for errors
2. Verify `SESSION_TIMEOUT` is set in AuthContext
3. Check localStorage is enabled
4. Clear browser cache and try again

---

## Performance Optimization

### Netlify Optimizations
- ✅ Automatic minification
- ✅ Automatic compression
- ✅ CDN distribution
- ✅ Automatic HTTPS
- ✅ Caching headers configured

### Backend Optimizations
- ✅ MongoDB indexing
- ✅ Request timeout (30s)
- ✅ Rate limiting
- ✅ Gzip compression
- ✅ Security headers

---

## Security Checklist

Before going live:

- [ ] All environment variables set
- [ ] HTTPS enabled (automatic on Netlify)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Error boundaries in place
- [ ] Session timeout working
- [ ] Development credentials disabled
- [ ] Email notifications working
- [ ] Database backups enabled

---

## Deployment Checklist

### Pre-Deployment
- [ ] Push all code to GitHub
- [ ] Test locally with `npm run dev`
- [ ] Run `npm run build` successfully
- [ ] All environment variables documented

### Render Deployment
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Set all environment variables
- [ ] Deploy backend
- [ ] Test health endpoint
- [ ] Copy backend URL

### Netlify Deployment
- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Test all features
- [ ] Check API Status debug panel

### Post-Deployment
- [ ] Test login with real credentials
- [ ] Create test student
- [ ] Verify email sent
- [ ] Create test result
- [ ] Check reports work
- [ ] Test CSV export
- [ ] Monitor error logs
- [ ] Set up UptimeRobot

---

## Useful Links

- **Netlify Dashboard**: https://app.netlify.com
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **UptimeRobot**: https://uptimerobot.com
- **Gmail App Passwords**: https://myaccount.google.com/apppasswords

---

## Support

If you encounter issues:

1. Check Netlify build logs: Site settings → Build & deploy → Deploys
2. Check Render logs: Service → Logs
3. Check browser console (F12)
4. Check MongoDB Atlas logs
5. Contact support if needed

---

## Next Steps

After deployment:

1. **Monitor Performance**: Check Netlify Analytics and Render Metrics
2. **Set Up Backups**: Enable MongoDB Atlas automated backups
3. **Configure Email**: Test all email notifications
4. **Add Custom Domain**: Point your domain to Netlify
5. **Set Up Monitoring**: Configure alerts for errors
6. **Document Process**: Keep deployment notes for future reference

---

## Estimated Costs

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Netlify | ✅ Included | $19/month |
| Render | ✅ Included | $7/month |
| MongoDB | ✅ 512MB | $57/month |
| Gmail | ✅ Included | N/A |
| **Total** | **$0/month** | **$83/month** |

---

## Congratulations! 🎉

Your Folusho Reporting Sheet is now live on the internet!

**Your URLs**:
- Frontend: `https://your-site-name.netlify.app`
- Backend: `https://folusho-backend.onrender.com`
- API: `https://folusho-backend.onrender.com/api`

Share with your school and start managing results!
