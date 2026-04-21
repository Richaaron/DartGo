# Vercel Deployment Guide - Folusho Reporting Sheet

## Overview

Deploy your Folusho Reporting Sheet as a full-stack application entirely on Vercel.

**Architecture**:
- **Frontend & Backend**: Vercel (React + Vite + Serverless Functions)
- **Database**: Supabase (PostgreSQL)

---

## Prerequisites

Before starting:
- [ ] GitHub account with code pushed
- [ ] Vercel account (free at https://vercel.com)
- [ ] Supabase project set up and schema applied
- [ ] Gmail app password for notifications

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "feat: move backend to Vercel serverless"
git push origin main
```

---

## Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add the following variables:

   **Frontend Settings:**
   - `VITE_API_URL`: `/api`

   **Database (Supabase):**
   - `SUPABASE_URL`: (From Supabase API settings)
   - `SUPABASE_SERVICE_ROLE_KEY`: (From Supabase API settings - use Service Role, not Anon)

   **Security:**
   - `JWT_SECRET`: (A long random string for session security)
   - `NODE_ENV`: `production`

   **Email (SMTP):**
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `folushovictoryschool@gmail.com`
   - `SMTP_PASS`: (Your Gmail App Password)
   - `SMTP_FROM`: `folushovictoryschool@gmail.com`

5. **Deploy**
   - Click "Deploy"
   - Your site will be live at: `https://your-project.vercel.app`

---

## Step 3: Verify Deployment

### Check Frontend
1. Go to your Vercel URL
2. Try logging in with test credentials
3. Create a student
4. Check if email is sent
5. View results

### Check API Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform an action (create student, etc.)
4. Verify API calls go to Render backend
5. Check API Status debug panel (bottom-right)

### Test Health Endpoint
```bash
curl https://folusho-backend.onrender.com/api/health
# Should return: {"status":"ok"}
```

---

## Step 4: Configure Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Click "Add Domain"
5. Enter your domain (e.g., `folusho.com`)
6. Follow DNS configuration steps
7. Vercel provides free SSL certificate

---

## Step 5: Set Up Monitoring

### Vercel Analytics
1. Go to your project
2. Click "Analytics"
3. Monitor traffic and performance
4. Set up notifications for errors

### Render Monitoring
1. Go to your Render service
2. Click "Metrics"
3. Monitor CPU, memory, requests
4. Set up alerts for high usage

### UptimeRobot (Keep Backend Awake)
1. Go to https://uptimerobot.com
2. Create monitor for: `https://folusho-backend.onrender.com/api/health`
3. Set interval to 5 minutes

---

## Troubleshooting

### Build Fails: `npm ERR! code ERESOLVE`

**Solution**:
1. Go to project settings
2. Click "Build & Development Settings"
3. Add environment variable: `NPM_FLAGS=--legacy-peer-deps`
4. Redeploy

### API Calls Failing

**Solution**:
1. Check backend is running on Render
2. Verify `VITE_API_URL` in Vercel environment
3. Check CORS is configured in backend
4. Check API Status debug panel

### Email Not Sending

**Solution**:
1. Verify Gmail app password in Render environment
2. Check Gmail account has 2FA enabled
3. Verify SMTP credentials are correct
4. Check email logs in MongoDB

### Site Shows Blank Page

**Solution**:
1. Check browser console (F12)
2. Check Vercel build logs
3. Verify environment variables
4. Check for TypeScript errors

---

## Environment Variables Reference

### For Vercel (Frontend)
```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

### For Render (Backend) - Already Set
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/folusho
PORT=3002
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-vercel-site.vercel.app
CORS_ORIGIN=https://your-vercel-site.vercel.app
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=folushovictoryschool@gmail.com
SMTP_PASS=fvvv lyzz hdsd aupi
SMTP_FROM=folushovictoryschool@gmail.com
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code pushed to GitHub
- [ ] Build successful locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] Environment variables documented

### Vercel Deployment
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Add environment variables
- [ ] Deploy project
- [ ] Verify deployment successful

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

## Performance Optimization

### Vercel Features
- ✅ Automatic minification
- ✅ Automatic compression
- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ Caching headers configured
- ✅ Edge functions support

### Frontend Optimizations
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Image optimization
- ✅ CSS minification

---

## Security Checklist

Before going live:
- [ ] All environment variables set
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Error boundaries in place
- [ ] Session timeout working
- [ ] Development credentials disabled
- [ ] Email notifications working
- [ ] Database backups enabled

---

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **UptimeRobot**: https://uptimerobot.com

---

## Support

If you encounter issues:

1. Check Vercel build logs: Project → Deployments → Click deployment → Logs
2. Check Render logs: Service → Logs
3. Check browser console (F12)
4. Check MongoDB Atlas logs
5. Contact support if needed

---

## Estimated Costs

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel | ✅ Included | $20/month |
| Render | ✅ Included | $7/month |
| MongoDB | ✅ 512MB | $57/month |
| Gmail | ✅ Included | N/A |
| **Total** | **$0/month** | **$84/month** |

---

## Next Steps After Deployment

1. **Monitor Performance**: Check Vercel Analytics
2. **Set Up Backups**: Enable MongoDB automated backups
3. **Configure Email**: Test all email notifications
4. **Add Custom Domain**: Point your domain to Vercel
5. **Set Up Monitoring**: Configure alerts for errors
6. **Keep Backend Awake**: Set up UptimeRobot

---

## Congratulations! 🎉

Your Folusho Reporting Sheet is now live on Vercel!

**Your URLs**:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://folusho-backend.onrender.com`
- API: `https://folusho-backend.onrender.com/api`

Share with your school and start managing results!
