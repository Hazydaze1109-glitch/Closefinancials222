# Close Finance - Loan Management System

A complete full-stack loan management application with user registration, loan applications, and admin dashboard.

## Project Structure

```
close-finance-standalone/
├── frontend/                 # Netlify frontend (HTML/CSS/JS)
│   ├── index.html           # Homepage
│   ├── login.html           # User login
│   ├── signup.html          # User registration
│   ├── loan-options.html    # Loan type selection
│   ├── apply-business.html  # Business loan form
│   ├── apply-for-loan.html  # Personal loan form
│   ├── style.css            # Styling
│   └── script.js            # Frontend logic
├── backend/
│   ├── api/
│   │   └── server.js        # Express API server
│   └── db/
│       └── schema.sql       # Database schema
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── vercel.json              # Vercel deployment config
├── netlify.toml             # Netlify deployment config
└── README.md                # This file
```

## Features

✅ User Registration & Login (with password hashing)
✅ Business Loan Application Form
✅ Personal Loan Application Form
✅ User Dashboard with Loan Status Tracking
✅ Admin Portal to Manage Applications
✅ Loan Status Updates (Processing → Accepted → Final Steps → Completed)
✅ Database Persistence
✅ JWT Authentication
✅ CORS Enabled

## Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Deployed on Netlify

**Backend:**
- Node.js + Express
- JWT Authentication
- Bcrypt Password Hashing
- MySQL Database
- Deployed on Vercel

## Setup Instructions

### 1. Database Setup

First, create a MySQL database:

```bash
mysql -u root -p < backend/db/schema.sql
```

Or manually run the SQL file in your MySQL client.

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with:
- Database credentials
- JWT secret
- Frontend URL

### 3. Install Dependencies

```bash
npm install
```

### 4. Local Testing

**Start Backend:**
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

**Test Frontend:**
Open `frontend/index.html` in your browser or use a local server:
```bash
cd frontend
python3 -m http.server 8000
```

Visit `http://localhost:8000`

## Deployment Guide

### Deploy Backend to Vercel

1. **Create Vercel Account** at https://vercel.com
2. **Connect GitHub Repository** (or upload files)
3. **Set Environment Variables** in Vercel Dashboard:
   - `DB_HOST` - Your MySQL host
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password
   - `DB_NAME` - Database name
   - `JWT_SECRET` - Random secret key
   - `FRONTEND_URL` - Your Netlify frontend URL

4. **Deploy:**
   ```bash
   npm install -g vercel
   vercel
   ```

5. **Note your Vercel URL** (e.g., `https://your-project.vercel.app`)

### Deploy Frontend to Netlify

1. **Create Netlify Account** at https://netlify.com
2. **Update Frontend API URL:**
   - Open `frontend/script.js`
   - Replace all `http://localhost:3001` with your Vercel backend URL
   - Example: `https://your-project.vercel.app`

3. **Deploy:**
   - Option A: Drag & drop `frontend` folder to Netlify
   - Option B: Connect GitHub and auto-deploy
   - Option C: Use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=frontend
     ```

4. **Note your Netlify URL** (e.g., `https://your-site.netlify.app`)

### Database Setup (Production)

For production, use a managed MySQL service:

**Option 1: PlanetScale (Recommended)**
- Sign up at https://planetscale.com
- Create a database
- Use connection string in `.env`

**Option 2: AWS RDS**
- Create MySQL instance
- Use endpoint in `.env`

**Option 3: DigitalOcean**
- Create Managed Database
- Use connection string in `.env`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Loans
- `POST /api/loans/business` - Submit business loan
- `POST /api/loans/personal` - Submit personal loan
- `GET /api/loans/my-application` - Get user's application

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/applications` - Get all applications
- `PUT /api/admin/applications/:id/status` - Update application status

## Frontend Pages

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Landing page |
| Login | `/login.html` | User login |
| Signup | `/signup.html` | User registration |
| Loan Options | `/loan-options.html` | Select loan type |
| Business Loan | `/apply-business.html` | Business loan form |
| Personal Loan | `/apply-for-loan.html` | Personal loan form |

## Admin Setup

To create an admin account, run this SQL:

```sql
INSERT INTO admin_users (email, password, name) 
VALUES ('admin@example.com', '$2b$10$...hashed_password...', 'Admin User');
```

Or use this Node script:

```javascript
const bcrypt = require('bcrypt');
const password = 'your-admin-password';
bcrypt.hash(password, 10, (err, hash) => {
  console.log(`INSERT INTO admin_users (email, password, name) VALUES ('admin@example.com', '${hash}', 'Admin');`);
});
```

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` is set in backend `.env`
- Check that frontend is making requests to correct backend URL

### Database Connection Errors
- Verify database credentials in `.env`
- Check database is running and accessible
- Ensure firewall allows connections

### Login Not Working
- Check password hashing in database
- Verify JWT_SECRET is set
- Check browser console for errors

## Support

For issues, check:
1. Console errors (browser dev tools)
2. Server logs (backend terminal)
3. Database connection
4. Environment variables

## License

ISC
