# Deploying to Koyeb (Free Forever Backend)

Koyeb is a great alternative to Render because its free tier **stays awake 24/7** (no 50-second delay when you first open the app).

## Steps to Deploy

1. **Create a Koyeb Account**
   - Go to [koyeb.com](https://www.koyeb.com) and sign up.

2. **Create a New App**
   - Click "Create App" and name it `folusho-backend`.
   - Choose "GitHub" as the deployment method.
   - Select your repository: `Richaaron/folushovictoryschools`.

3. **Configure the Service**
   - Koyeb will automatically detect the `koyeb.yaml` file I created.
   - You just need to add your **Secrets** (Environment Variables).

4. **Add Secrets (Environment Variables)**
   In the Koyeb dashboard, go to the "Secrets" tab or the "Environment Variables" section of your service and add these:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A long random string (e.g., `your-secret-key-123`).
   - `SMTP_USER`: Your email for notifications.
   - `SMTP_PASS`: Your email app password.
   - `SMTP_FROM`: The "from" email address.

5. **Deploy**
   - Click "Deploy". Once it's finished, you'll get a URL like `https://folusho-backend-xxxx.koyeb.app`.

6. **Update Frontend**
   - Go to your Vercel dashboard for the frontend.
   - Change the `VITE_API_URL` environment variable to your new Koyeb URL.
   - Re-deploy the frontend.

## Why this is better than Render:
- **Always On**: Your website will load instantly every time.
- **Auto-Update**: Every time you push code to GitHub, Koyeb will build and deploy it automatically.
- **Persistence**: Since your data is in MongoDB Atlas, your data is never lost even when the server restarts.
