# Supabase Setup Guide for School Management System

## Quick Setup (5 minutes)

### 1. Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up with GitHub** (recommended)
4. **Create new organization**: "Folusho Schools"
5. **Create project**: "School Management System"
6. **Set database password**: Choose a strong password
7. **Wait 2-3 minutes** for project setup

### 2. Get Your Credentials

1. **Go to Project Settings** (gear icon)
2. **Click "API"**
3. **Copy these values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (long string)
   - **service_role**: `eyJ...` (long string)

### 3. Set Up Database Schema

1. **Go to SQL Editor** (left sidebar)
2. **Copy and paste** the SQL from `backend/database/supabase-schema.sql`
3. **Click "Run"** to execute the schema
4. **Verify tables created** in the Database section

### 4. Configure Backend

1. **Create `.env` file** in backend folder:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

2. **Replace with your actual credentials**

### 5. Test the Connection

1. **Start the backend server**:
```bash
cd backend
npm run dev
```

2. **Check console** for "Supabase connected successfully"

## Detailed Setup Instructions

### Step 1: Supabase Project Creation

#### Create Account
- Visit [supabase.com](https://supabase.com)
- Click "Start your project"
- Choose GitHub authentication (recommended)
- Follow the OAuth flow

#### Create Organization
- Organization name: "Folusho Schools"
- This is free and can be changed later

#### Create Project
- Project name: "School Management System"
- Database password: Use a strong password (save it!)
- Region: Choose closest to your users
- Pricing plan: Free tier (perfect for starting)

### Step 2: Database Schema Setup

#### Run the Schema SQL
1. **Navigate to SQL Editor** in Supabase dashboard
2. **Copy the entire content** from `backend/database/supabase-schema.sql`
3. **Paste into the SQL Editor**
4. **Click "Run"**
5. **Wait for completion** (should be instant)

#### Verify Schema
1. **Go to Database** section
2. **Click "Tables"**
3. **You should see**: users, students, subjects, results
4. **Click each table** to verify columns

### Step 3: Backend Configuration

#### Update Environment Variables
Create `.env` file in `backend/` folder:

```env
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Where to Find Credentials
1. **Project Settings** (gear icon)
2. **API section**
3. **Copy Project URL** and **anon key**
4. **Service role key** is also there (for admin operations)

### Step 4: Update Backend Code

#### Update Main Server File
Change `backend/src/index.ts` to use Supabase:

```javascript
// Replace this line:
import sequelize from './config/database';

// With this:
import { testConnection } from './config/supabase';

// Replace database connection:
// sequelize.sync().then(() => {
//   app.listen(PORT, () => {
//     console.log('Server running');
//   });
// });

// With this:
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log('Server running');
  });
});
```

#### Update Auth Routes
Change the auth import in `backend/src/index.ts`:

```javascript
// Replace:
import authRoutes from './routes/auth';

// With:
import authRoutes from './routes/authSupabase';
```

### Step 5: Test the Setup

#### Start Backend Server
```bash
cd backend
npm run dev
```

#### Expected Output
```
Server is running on port 3001
Supabase connected successfully
Environment: development
```

#### Test API Endpoints
1. **Register a user**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@folusho.com",
    "password": "AdminPassword123!",
    "name": "Admin User",
    "role": "Admin"
  }'
```

2. **Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@folusho.com",
    "password": "AdminPassword123!"
  }'
```

## Migration from PostgreSQL to Supabase

### What Changed
- **Database**: PostgreSQL (local) -> Supabase (cloud)
- **ORM**: Sequelize -> Supabase client
- **Models**: Sequelize models -> Supabase queries
- **Authentication**: Custom -> Supabase Auth (optional)

### Benefits of Supabase
- **No database setup**: Managed for you
- **Automatic backups**: Built-in
- **Real-time features**: Live updates
- **File storage**: Built-in
- **Authentication**: Built-in (optional)
- **Free tier**: 500MB database, generous limits

### Data Migration (Optional)
If you have existing data in PostgreSQL:

1. **Export from PostgreSQL**:
```bash
pg_dump -h localhost -U postgres folusho_school_dev > data.sql
```

2. **Import to Supabase**:
   - Go to SQL Editor in Supabase
   - Paste the exported SQL
   - Run the import

## Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
- **Solution**: Check `.env` file exists and has correct values
- **Verify**: URL and keys are copied correctly

#### "Supabase connection failed"
- **Solution**: Check project URL and keys
- **Verify**: Project is not paused
- **Check**: Network connectivity

#### "Table does not exist"
- **Solution**: Run the schema SQL in Supabase SQL Editor
- **Verify**: All tables are created successfully

#### "Permission denied"
- **Solution**: Check RLS policies in schema
- **Verify**: User has appropriate permissions

### Debug Steps

1. **Check environment variables**:
```bash
cd backend
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

2. **Test connection manually**:
```javascript
// In backend/src/config/supabase.ts
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey?.substring(0, 10) + '...');
```

3. **Check Supabase logs**:
   - Go to Supabase project
   - Click "Logs" in sidebar
   - Check for errors

## Next Steps

### 1. Create Test Data
Add sample users, students, and subjects to test the system.

### 2. Update Frontend
Update Flutter app to use the new backend endpoints.

### 3. Deploy to Production
- Deploy backend to Render
- Deploy frontend to Netlify
- Update production URLs

### 4. Add Real-time Features
Use Supabase real-time subscriptions for live updates.

## Production Considerations

### Security
- **Never commit `.env` file** to git
- **Use strong JWT secret**
- **Enable RLS policies** (included in schema)
- **Use service role key** only for admin operations

### Performance
- **Add database indexes** (included in schema)
- **Use connection pooling** (handled by Supabase)
- **Monitor usage** in Supabase dashboard

### Scaling
- **Monitor free tier limits**
- **Upgrade when needed** (very affordable)
- **Consider read replicas** for high traffic

## Support Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript Client Guide](https://supabase.com/docs/reference/javascript)

### Community
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com)

### Help
- **Check this guide first**
- **Search Supabase docs**
- **Ask in Discord community**

Your Supabase-powered school management system is ready!
