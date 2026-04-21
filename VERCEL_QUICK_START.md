# Vercel Deployment - Quick Start (5 Minutes)

## 🚀 Deploy in 5 Steps

### Step 1: Push to GitHub (2 min)
```bash
cd "c:\Users\PASTOR\Desktop\Folusho Reporting Sheet"
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### Step 2: Go to Vercel (1 min)
1. Visit https://vercel.com/dashboard
2. Sign in with GitHub
3. Click "Add New..." → "Project"

### Step 3: Import Repository (1 min)
1. Select your GitHub repository
2. Click "Import"
3. Vercel auto-detects Vite configuration

### Step 4: Add Environment Variables (1 min)
1. Click "Environment Variables"
2. Add these two variables:

```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

3. Click "Deploy"

### Step 5: Wait & Test (1 min)
1. Wait for deployment (2-5 minutes)
2. Click "Visit" to see your live site
3. Test login and create a student

---

## ✅ What Gets Deployed

- React frontend
- All components
- Validators
- Error boundary
- API service with fallback
- Automatic HTTPS
- Global CDN

---

## 🔗 Your URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend | `https://your-project.vercel.app` |
| Backend | `https://folusho-backend.onrender.com` |
| API | `https://folusho-backend.onrender.com/api` |

---

## 🧪 Test Your Deployment

1. **Login**: Use test credentials
2. **Create Student**: Add a test student
3. **Check Email**: Verify registration email sent
4. **Create Result**: Add a test result
5. **View Reports**: Check reports work

---

## ⚠️ Common Issues & Fixes

### Build Fails
**Error**: `npm ERR! code ERESOLVE`
**Fix**: Add env var `NPM_FLAGS=--legacy-peer-deps`

### API Calls Failing
**Error**: `Failed to fetch from API`
**Fix**: 
1. Check backend is running
2. Verify `VITE_API_URL` is correct
3. Check CORS in backend

### Blank Page
**Error**: Site shows blank page
**Fix**:
1. Check browser console (F12)
2. Check Vercel build logs
3. Verify environment variables

---

## 📋 Environment Variables Needed

### For Vercel (Frontend)
```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

### For Render (Backend) - Already Set
- MONGO_URI
- JWT_SECRET
- SMTP credentials
- FRONTEND_URL (update to your Vercel URL)

---

## 🎯 After Deployment

1. **Update Render FRONTEND_URL**
   - Go to Render dashboard
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy backend

2. **Set Up UptimeRobot**
   - Go to https://uptimerobot.com
   - Monitor: `https://folusho-backend.onrender.com/api/health`
   - Interval: 5 minutes

3. **Monitor Performance**
   - Check Vercel Analytics
   - Check Render Metrics
   - Set up alerts

---

## 📊 Deployment Timeline

| Step | Time |
|------|------|
| Push to GitHub | 2 min |
| Import to Vercel | 1 min |
| Add Env Vars | 1 min |
| Deploy | 2-5 min |
| Test | 1 min |
| **Total** | **7-10 min** |

---

## 🔐 Security Features

✅ HTTPS (automatic)
✅ CORS configured
✅ Rate limiting
✅ Input validation
✅ Error boundaries
✅ Session timeout
✅ Request timeout
✅ Dev credentials disabled

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Build Logs**: Project → Deployments → Logs
- **Environment**: Project → Settings → Environment Variables

---

## 🎉 You're Live!

Your Folusho Reporting Sheet is now deployed on Vercel!

**Next**: Share your URL with your school and start managing results!
