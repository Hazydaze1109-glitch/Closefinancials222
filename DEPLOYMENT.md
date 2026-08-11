# Deployment Guide - Close Finance

Complete step-by-step guide to deploy your Close Finance application to Vercel (Backend) and Netlify (Frontend).

## Prerequisites

- GitHub account (for version control)
- Vercel account (https://vercel.com)
- Netlify account (https://netlify.com)
- MySQL database (PlanetScale, AWS RDS, or DigitalOcean)

## Step 1: Prepare Your Code

### 1.1 Create GitHub Repository

```bash
cd close-finance-standalone
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/close-finance.git
git push -u origin main
```

### 1.2 Update Frontend API URLs

Edit `frontend/script.js` and replace all instances of:
```javascript
// OLD
const API_URL = 'http://localhost:3001';

// NEW
const API_URL = 'https://your-vercel-backend.vercel.app';
```

## Step 2: Set Up Database

### Option A: PlanetScale (Recommended)

1. Go to https://planetscale.com and sign up
2. Create a new database named `close_finance`
3. Click "Connect" and copy the connection string
4. Your connection string will look like:
   ```
   mysql://user:password@host/close_finance?sslaccept=strict
   ```

### Option B: AWS RDS

1. Go to AWS Console → RDS
2. Create MySQL instance
3. Run `backend/db/schema.sql` using MySQL Workbench or CLI
4. Get your endpoint (e.g., `mydb.xxxxx.us-east-1.rds.amazonaws.com`)

### Option C: DigitalOcean

1. Go to DigitalOcean → Managed Databases
2. Create MySQL cluster
3. Get connection string from dashboard

### Create Admin Account

Connect to your database and run:

```sql
-- First, generate a bcrypt hash for your password
-- Use an online tool or run this Node script:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('your-password', 10, console.log);

INSERT INTO admin_users (email, password, name) 
VALUES ('admin@example.com', '$2b$10$...paste_bcrypt_hash_here...', 'Admin User');
```

## Step 3: Deploy Backend to Vercel

### 3.1 Connect Vercel to GitHub

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"

### 3.2 Configure Environment Variables

In Vercel Dashboard:

1. Go to Settings → Environment Variables
2. Add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `DB_HOST` | Your database host | `aws.connect.psdb.cloud` |
| `DB_USER` | Database username | `user123` |
| `DB_PASSWORD` | Database password | `pscale_pw_xxx` |
| `DB_NAME` | Database name | `close_finance` |
| `JWT_SECRET` | Random secret key | `your-super-secret-key-12345` |
| `FRONTEND_URL` | Your Netlify URL | `https://your-site.netlify.app` |

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your Vercel URL (e.g., `https://close-finance.vercel.app`)

### 3.4 Test Backend

```bash
curl https://your-vercel-url.vercel.app/api/health
```

Should return: `{"status":"ok"}`

## Step 4: Deploy Frontend to Netlify

### 4.1 Update Frontend with Backend URL

Edit `frontend/script.js`:

```javascript
// Replace with your Vercel backend URL
const API_URL = 'https://your-vercel-backend.vercel.app';
```

### 4.2 Deploy to Netlify

**Option A: Drag & Drop**
1. Go to https://netlify.com/drop
2. Drag the `frontend` folder
3. Done! You'll get a Netlify URL

**Option B: GitHub Integration**
1. Go to https://netlify.com/dashboard
2. Click "New site from Git"
3. Select your GitHub repository
4. Set build command: (leave empty)
5. Set publish directory: `frontend`
6. Click "Deploy"

**Option C: Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=frontend
```

### 4.3 Get Your Netlify URL

After deployment, you'll see your site URL (e.g., `https://your-site.netlify.app`)

## Step 5: Update Backend CORS

Go back to Vercel and update:
- `FRONTEND_URL` = Your Netlify URL

This allows frontend to communicate with backend.

## Step 6: Test the Application

### 6.1 Test User Registration

1. Go to your Netlify URL
2. Click "Sign Up"
3. Fill in the form
4. Click "Create Account"
5. Should redirect to dashboard

### 6.2 Test Loan Application

1. From dashboard, click "Apply for Business Loan"
2. Fill in the form
3. Submit
4. Should see success message

### 6.3 Test Admin Portal

1. Go to `/admin-login.html` on your Netlify site
2. Login with admin credentials
3. Should see all applications

## Troubleshooting

### "Cannot connect to database"
- Check database credentials in Vercel
- Verify database is running
- Check firewall/security groups allow connections

### "CORS error"
- Make sure `FRONTEND_URL` is set in Vercel
- Check frontend is using correct backend URL
- Verify backend allows requests from frontend

### "Login not working"
- Check browser console for errors
- Verify database has users table
- Check JWT_SECRET is set

### "Admin login fails"
- Verify admin user exists in database
- Check password hash is correct
- Try resetting admin password

## Monitoring & Maintenance

### View Vercel Logs

```bash
vercel logs
```

### View Netlify Logs

In Netlify Dashboard → Deploys → View deploy log

### Update Code

After making changes:

```bash
git add .
git commit -m "Your message"
git push
```

Both Vercel and Netlify will auto-deploy!

## Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong JWT_SECRET** - Generate random string
3. **Use HTTPS** - Both Vercel and Netlify provide SSL
4. **Rotate passwords** - Change admin password regularly
5. **Backup database** - Set up automated backups

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Deploy frontend to Netlify
3. ✅ Test all features
4. ✅ Set up monitoring
5. ✅ Configure custom domain (optional)

## Support

For issues:
- Check Vercel logs: `vercel logs`
- Check Netlify logs: Dashboard → Deploys
- Check browser console: F12 → Console tab
- Check database connection

Good luck! 🚀
