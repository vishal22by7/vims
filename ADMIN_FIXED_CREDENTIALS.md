# 🔐 Fixed Admin Credentials

## Default Admin Account

A fixed admin account is automatically created/updated when you run the setup script.

### Login Credentials

- **Email:** `admin@vims.com`
- **Password:** `admin123456`
- **Role:** `admin`

## How to Create/Update Admin Account

### Method 1: Automated Script (Recommended)

```powershell
npm run create-admin
```

This will:
- ✅ Create admin account if it doesn't exist
- ✅ Update existing account to admin role
- ✅ Show you the login credentials

### Method 2: Manual MongoDB Update

**Using MongoDB Compass:**
1. Connect to your MongoDB database
2. Go to `vims` database → `users` collection
3. Find user with email `admin@vims.com`
4. If exists, update `role` to `"admin"`
5. If doesn't exist, create new user with:
   - email: `admin@vims.com`
   - passwordHash: (generate with bcrypt)
   - role: `admin`

**Using mongosh:**
```javascript
use vims
db.users.updateOne(
  { email: "admin@vims.com" },
  { $set: { role: "admin" } }
)
```

## Admin Features

Once logged in as admin, you'll see:

### Navigation Menu
- **Dashboard** - Admin dashboard with statistics
- **Policy Types** - Manage insurance policy types
- **Users** - View all registered users
- **View Policies** - View all policies in system
- **View Claims** - Review and manage all claims

### Admin Dashboard Features
- System statistics (users, policies, claims)
- Quick action cards
- Pending claims notification
- Professional admin interface

### Admin Badge
- Your name in navbar shows "Admin" badge
- Clear visual indication of admin role

## Security Note

⚠️ **For Development Only!**

The default admin credentials are for development/testing purposes. 

**For Production:**
- Change the admin password
- Use strong, unique passwords
- Implement proper access controls
- Consider using environment variables for admin credentials

## Quick Start

1. **Create admin account:**
   ```powershell
   npm run create-admin
   ```

2. **Login:**
   - Go to: http://localhost:3000/login
   - Email: `admin@vims.com`
   - Password: `admin123456`

3. **Access Admin Dashboard:**
   - Automatically redirected to: http://localhost:3000/admin
   - Or click "Dashboard" in navbar

## Troubleshooting

### Can't login as admin?
- Run: `npm run create-admin`
- Check MongoDB connection
- Verify email is exactly: `admin@vims.com`

### Don't see admin menu?
- Logout and login again
- Check user role in MongoDB: `db.users.findOne({email: "admin@vims.com"})`
- Clear browser cache/localStorage

### Admin dashboard not loading?
- Check backend is running
- Verify admin API routes are accessible
- Check browser console for errors

