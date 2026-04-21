# Netlify Deployment - Quick Start Checklist

## 🚀 Quick Deploy in 5 Steps

### Step 1: Push to GitHub (5 minutes)
```bash
cd "c:\Users\PASTOR\Desktop\Folusho Reporting Sheet"
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

### Step 2: Deploy Backend to Render (10 minutes)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Add environment variables (see below)
8. Click "Create Web Service"
9. **Copy your backend URL** (e.g., `https://folusho-backend.onrender.com`)

**Environment Variables for Render**:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/folusho
PORT=3002
JWT_SECRET=your-secret-key-at-least-32-characters
FRONTEND_URL=https://your-netlify-site.netlify.app
CORS_ORIGIN=https://your-netlify-site.netlify.app
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=folushovictoryschool@gmail.com
SMTP_PASS=fvvv lyzz hdsd aupi
SMTP_FROM=folushovictoryschool@gmail.com
```

### Step 3: Deploy Frontend to Netlify (5 minutes)
1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy site"
8. **Copy your Netlify URL** (e.g., `https://your-site.netlify.app`)

### Step 4: Add Environment Variables to Netlify (2 minutes)
1. Go to Site settings → Build & deploy → Environment
2. Add these variables:
```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```
3. Click "Redeploy site"

### Step 5: Test & Verify (5 minutes)
1. Go to your Netlify URL
2. Try logging in
3. Create a student
4. Check if email is sent
5. View results

---

## 📋 Environment Variables Needed

### For Render Backend:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Long random string (32+ characters)
- `FRONTEND_URL` - Your Netlify URL
- `CORS_ORIGIN` - Your Netlify URL
- `SMTP_USER` - Gmail address
- `SMTP_PASS` - Gmail app password

### For Netlify Frontend:
- `VITE_API_URL` - Your Render backend URL + `/api`
- `VITE_BACKUP_API_URL` - Supabase backend URL + `/api`

---

## 🔗 Important URLs

After deployment, you'll have:

| Service | URL |
|---------|-----|
| Frontend | `https://your-site.netlify.app` |
| Backend | `https://folusho-backend.onrender.com` |
| API | `https://folusho-backend.onrender.com/api` |
| Health Check | `https://folusho-backend.onrender.com/api/health` |

---

## ⚠️ Common Issues & Fixes

### Build Fails: `npm ERR! code ERESOLVE`
**Fix**: Add to Netlify environment: `NPM_FLAGS=--legacy-peer-deps`

### API Calls Failing
**Fix**: 
1. Check backend is running on Render
2. Verify `VITE_API_URL` in Netlify environment
3. Check CORS in backend

### Email Not Sending
**Fix**:
1. Verify Gmail app password
2. Check 2FA is enabled on Gmail
3. Verify SMTP credentials

### Site Shows Blank Page
**Fix**:
1. Check browser console (F12)
2. Check Netlify build logs
3. Verify environment variables

---

## 🎯 What Gets Deployed

### Netlify (Frontend)
- React app
- Vite build
- All components
- Validators
- Error boundary
- API service with fallback

### Render (Backend)
- Node.js server
- MongoDB models
- API routes
- Email service
- Authentication
- Activity logging

---

## 📊 Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Push to GitHub | 5 min | ⏳ |
| Deploy Backend | 10 min | ⏳ |
| Deploy Frontend | 5 min | ⏳ |
| Configure Env Vars | 2 min | ⏳ |
| Test & Verify | 5 min | ⏳ |
| **Total** | **27 min** | ✅ |

---

## 🔐 Security Checklist

Before going live:
- [ ] All environment variables set
- [ ] HTTPS enabled (automatic)
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Error boundaries in place
- [ ] Session timeout working
- [ ] Dev credentials disabled
- [ ] Email notifications working

---

## 📞 Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Render Docs**: https://render.com/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Vite Docs**: https://vitejs.dev

---

## ✅ After Deployment

1. **Monitor**: Check Netlify Analytics and Render Metrics
2. **Backup**: Enable MongoDB automated backups
3. **Domain**: Add custom domain to Netlify
4. **Alerts**: Set up error notifications
5. **Keep Alive**: Set up UptimeRobot for backend

---

## 🎉 You're Live!

Your Folusho Reporting Sheet is now deployed and accessible to the world!

**Next**: Share your URL with your school and start managing results!
