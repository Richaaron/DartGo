# MongoDB + Render Setup Guide (Simple)

## What You Need to Change

Your current backend uses **PostgreSQL**. For MongoDB, you need to:

1. **Change database code** from Sequelize to Mongoose
2. **Use MongoDB Atlas** (free cloud database)
3. **Deploy to Render** (backend hosting)

## Simple 3-Step Process

### Step 1: Get Free MongoDB Database

#### Go to MongoDB Atlas
1. Visit [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click "Try Free"
3. Create account
4. Create "Shared Cluster" (free)
5. Get connection string

#### Connection String Looks Like:
```
mongodb+srv://username:password@cluster.mongodb.net/school_db
```

### Step 2: Update Your Backend Code

#### Install MongoDB Driver
```bash
cd server
npm install mongoose
```

#### Replace Database Connection
**Connection logic is in `server/src/config/db.ts`**
```javascript
// server/src/config/db.ts
import mongoose from 'mongoose'
// ...
```

**NEW (MongoDB):**
```javascript
// backend/src/config/database.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};
```

#### Update Models
**OLD (User Model - PostgreSQL):**
```javascript
// backend/src/models/User.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  // ... Sequelize code
}

User.init({
  email: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  // ... other fields
}, { sequelize });
```

**NEW (User Model - MongoDB):**
```javascript
// backend/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Teacher', 'Student', 'Parent'] },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);
```

### Step 3: Deploy to Render

#### Update Environment Variables
In Render dashboard, add:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school_db
JWT_SECRET=your-secret-key
NODE_ENV=production
```

#### Update Main Server File
**OLD:**
```javascript
// backend/src/index.ts
import sequelize from './config/database';

// Start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log('Server running');
  });
});
```

**NEW:**
```javascript
// backend/src/index.ts
import { connectDB } from './config/database';

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('Server running');
  });
});
```

## Quick Migration Checklist

### 1. Database Setup
- [ ] Create MongoDB Atlas account
- [ ] Create free cluster
- [ ] Get connection string
- [ ] Create database user

### 2. Code Changes
- [ ] Install mongoose: `npm install mongoose`
- [ ] Update database connection
- [ ] Convert all models to Mongoose schemas
- [ ] Update API endpoints to use Mongoose

### 3. Deployment
- [ ] Push code to GitHub
- [ ] Create Render web service
- [ ] Add MongoDB URI to environment
- [ ] Deploy and test

## Example: Complete User Model

```javascript
// backend/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Teacher', 'Student', 'Parent'], default: 'Student' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
```

## Example: API Endpoint Update

**OLD (Sequelize):**
```javascript
// Get all users
const users = await User.findAll();
```

**NEW (Mongoose):**
```javascript
// Get all users
const users = await User.find({});
```

## Why MongoDB is Easier

### Advantages
- **No schema migrations** - flexible structure
- **JSON-like documents** - JavaScript friendly
- **Free cloud hosting** - MongoDB Atlas
- **Simple scaling** - automatic

### Disadvantages
- **No SQL joins** - different query patterns
- **Less strict** - no schema enforcement
- **Learning curve** - different from SQL

## Final Steps

1. **Create MongoDB Atlas account** (5 minutes)
2. **Update your backend code** (1-2 hours)
3. **Deploy to Render** (10 minutes)
4. **Test everything** (15 minutes)

## Total Time: ~2-3 hours

## Need Help?

- MongoDB Atlas has great documentation
- Mongoose docs are very clear
- I can help convert specific models
- Render has good deployment guides

This is much simpler than it sounds! The key is just changing the database connection and models.
