# Deployment Commands - Quick Reference

## 🚀 One-Command Deployment

### Step 1: Push to GitHub
```bash
cd "c:\Users\PASTOR\Desktop\Folusho Reporting Sheet"
git add .
git commit -m "Deploy to Vercel - Production Ready"
git push origin main
```

### Step 2: Deploy to Vercel (Manual)
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your repository
4. Add environment variables:
   - `VITE_API_URL=https://folusho-backend.onrender.com/api`
   - `VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api`
5. Click "Deploy"

---

## 🧪 Testing Commands

### Build Test
```bash
npm run build
```

### Development Test
```bash
npm run dev
```

### Type Check
```bash
npx tsc --noEmit
```

### Lint Check
```bash
npm run lint
```

---

## 📊 Verification Commands

### Check Backend Health
```bash
curl https://folusho-backend.onrender.com/api/health
```

### Check Frontend Build
```bash
npm run build
ls dist/
```

### Check Git Status
```bash
git status
```

### Check Git Log
```bash
git log --oneline -5
```

---

## 🔧 Maintenance Commands

### Update Dependencies
```bash
npm update
```

### Install Dependencies
```bash
npm install
```

### Clean Build
```bash
rm -rf dist
npm run build
```

### Clear Node Modules
```bash
rm -rf node_modules
npm install
```

---

## 📝 Git Commands

### Add All Changes
```bash
git add .
```

### Commit Changes
```bash
git commit -m "Your message here"
```

### Push to GitHub
```bash
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### View Commit History
```bash
git log --oneline
```

### Check Uncommitted Changes
```bash
git status
```

---

## 🌐 Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://folusho-backend.onrender.com/api
VITE_BACKUP_API_URL=https://your-supabase-backend.onrender.com/api
```

### Backend (Render Dashboard)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/folusho
PORT=3002
JWT_SECRET=your-secret-key-at-least-32-characters
FRONTEND_URL=https://your-vercel-site.vercel.app
CORS_ORIGIN=https://your-vercel-site.vercel.app
NODE_ENV=production
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

---

## 📋 Deployment Checklist

### Before Deployment
```bash
# 1. Check build
npm run build

# 2. Check types
npx tsc --noEmit

# 3. Check git status
git status

# 4. Add all changes
git add .

# 5. Commit
git commit -m "Deploy to Vercel"

# 6. Push
git push origin main
```

### After Deployment
```bash
# 1. Test health endpoint
curl https://folusho-backend.onrender.com/api/health

# 2. Visit your Vercel URL
# https://your-project.vercel.app

# 3. Test login
# Use test credentials

# 4. Create test student
# Check email notification

# 5. Create test result
# Check reports work
```

---

## 🔍 Debugging Commands

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

### Check Git Version
```bash
git --version
```

### View Environment Variables
```bash
# Windows
set | findstr VITE

# Mac/Linux
env | grep VITE
```

---

## 📱 Mobile Testing

### Test on Mobile
1. Deploy to Vercel
2. Get your Vercel URL
3. Open on mobile device
4. Test all features
5. Check responsive design

---

## 🚨 Emergency Commands

### Rollback Last Commit
```bash
git revert HEAD
git push origin main
```

### Force Push (Use with Caution!)
```bash
git push origin main --force
```

### Reset to Last Commit
```bash
git reset --hard HEAD
```

### Clear Git Cache
```bash
git rm -r --cached .
git add .
git commit -m "Clear cache"
```

---

## 📊 Monitoring Commands

### Check Vercel Deployments
- Visit: https://vercel.com/dashboard
- Select project
- View deployments

### Check Render Logs
- Visit: https://dashboard.render.com
- Select service
- View logs

### Check MongoDB
- Visit: https://cloud.mongodb.com
- Select cluster
- View metrics

---

## 🎯 Quick Deploy Script

Save this as `deploy.bat`:

```batch
@echo off
echo Deploying Folusho Reporting Sheet to Vercel...
echo.

echo Step 1: Building...
call npm run build
if errorlevel 1 goto error

echo.
echo Step 2: Adding changes...
call git add .
if errorlevel 1 goto error

echo.
echo Step 3: Committing...
call git commit -m "Deploy to Vercel"
if errorlevel 1 goto error

echo.
echo Step 4: Pushing to GitHub...
call git push origin main
if errorlevel 1 goto error

echo.
echo ✓ Deployment successful!
echo Visit: https://vercel.com/dashboard
pause
exit /b 0

:error
echo ✗ Deployment failed!
pause
exit /b 1
```

Run with: `deploy.bat`

---

## 📞 Support

If you encounter issues:

1. Check build logs: `npm run build`
2. Check types: `npx tsc --noEmit`
3. Check git status: `git status`
4. Check Vercel logs: https://vercel.com/dashboard
5. Check Render logs: https://dashboard.render.com

---

## ✅ All Commands Summary

| Command | Purpose |
|---------|---------|
| `npm run build` | Build for production |
| `npm run dev` | Start development server |
| `npm run lint` | Check code quality |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit changes |
| `git push origin main` | Push to GitHub |
| `curl https://...` | Test API health |

---

## 🎉 You're Ready!

All commands are ready to use. Follow VERCEL_QUICK_START.md to deploy!
