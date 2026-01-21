# Admin Dashboard Access Guide

## Overview
The Admin Dashboard provides comprehensive management capabilities including user management, upload monitoring, and system performance analytics.

## Accessing the Admin Dashboard

### URL
Navigate to: **`/admin`**

Full URL: `https://3000-i1gm1smrvkqg126oznbcc-82c4f221.us2.manus.computer/admin`

### Authentication Requirements
1. **Must be logged in** - You need an authenticated user account
2. **Must have admin role** - Your user account must have `role = 'admin'` in the database

## Admin Accounts Created

I've set up admin access for you:

1. **Your Account** - Updated the first user account (earliest created) to have admin role
2. **Test Admin Account** - Created a dedicated test admin account:
   - Name: Test Admin
   - Email: admin@test.com
   - OpenID: test-admin-001
   - Role: admin

## Granting Admin Access to Other Users

To grant admin access to additional users, you can use the Database panel in the Management UI:

1. Open the **Management UI** (right panel)
2. Click on **Database** tab
3. Navigate to the `users` table
4. Find the user you want to promote
5. Edit their `role` field to `admin`
6. Save changes

Alternatively, you can use SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

## Admin Dashboard Features

Once you have admin access, you can:

### User Management
- View all registered users
- See user statistics (total users, active users, new signups)
- Monitor user activity and upload counts
- Delete users (with self-deletion prevention)

### Upload Monitoring
- View all uploads across all users
- See upload statistics (total uploads, total records, average file size)
- Monitor recent upload activity
- Track upload success/failure rates
- Delete uploads if needed

### Performance Analytics (at `/performance`)
- View aggregate upload statistics
- Monitor processing times (validation, parsing, upload)
- Track file size distribution
- Analyze success/failure rates
- Identify performance bottlenecks

## Security Notes

- **Admin-only routes** are protected by middleware that checks the user's role
- **Self-deletion prevention** - Admins cannot delete their own accounts
- **Tenant isolation** - Each user can only see their own data (except admins)
- **Audit trail** - All admin actions should be logged (future enhancement)

## Troubleshooting

### "Access Denied" or redirected to home page
- Verify you're logged in
- Check your user role in the database: `SELECT role FROM users WHERE email = 'your@email.com';`
- Ensure your role is set to `'admin'` (not `'user'`)

### Can't see admin menu/link
- The admin dashboard link is not currently in the main navigation
- You must navigate directly to `/admin` URL
- Consider adding an admin menu item for easier access (future enhancement)

### Database connection issues
- Check that the database is running
- Verify database credentials in environment variables
- Check server logs for connection errors

## Next Steps

Consider these enhancements for better admin experience:

1. **Add Admin Menu Item** - Add a visible "Admin" link in the header for users with admin role
2. **Activity Logs** - Implement audit logging for all admin actions
3. **Role Management UI** - Create a dedicated interface for managing user roles
4. **Bulk Operations** - Add ability to perform bulk actions on users/uploads
5. **Email Notifications** - Send alerts when critical events occur (e.g., failed uploads spike)
