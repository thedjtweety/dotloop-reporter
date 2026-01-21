# Admin Dashboard Guide

## Overview

The **Admin Dashboard** is a powerful management interface designed for Dotloop administrators to monitor system usage, manage user accounts, and oversee all data uploads across the platform. This centralized control panel provides complete visibility into the Dotloop Reporting Tool's operations.

---

## Accessing the Admin Dashboard

### URL
Navigate to: **`/admin`**

Example: `https://your-domain.com/admin`

### Access Control
- **Authentication Required**: You must be logged in to access the dashboard
- **Role-Based Authorization**: Only users with the `admin` role can view this page
- **Automatic Redirect**: Non-admin users attempting to access `/admin` will see an "Access Denied" message with a link to return to the main application

### How to Grant Admin Access
Admin privileges are controlled via the `role` field in the `users` table:

1. **Via Database UI** (Recommended):
   - Navigate to the Database panel in the Management UI
   - Find the `users` table
   - Locate the user you want to promote
   - Change their `role` field from `user` to `admin`

2. **Via SQL** (Advanced):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
   ```

3. **Via Admin Dashboard** (After initial admin is created):
   - Log in as an existing admin
   - Navigate to the "User Management" tab
   - Click "Promote" next to the target user

---

## Dashboard Features

### 1. System Statistics (Top Cards)

The dashboard displays four key metrics at a glance:

#### **Total Users**
- **Description**: The total number of registered users in the system
- **Icon**: Users icon (blue)
- **Use Case**: Monitor user growth and adoption rates

#### **Admin Users**
- **Description**: The number of users with admin privileges
- **Icon**: Shield icon (green)
- **Use Case**: Track administrative access and ensure proper role distribution

#### **Total Uploads**
- **Description**: The cumulative number of CSV files uploaded by all users
- **Icon**: File icon (blue)
- **Use Case**: Measure platform activity and data ingestion volume

#### **Total Records**
- **Description**: The total number of transaction records across all uploads
- **Icon**: Database icon (purple)
- **Use Case**: Understand the scale of data being processed

---

### 2. User Management Tab

The **User Management** tab provides a comprehensive view of all registered users and their activity.

#### Table Columns:
- **Name**: The user's display name (from OAuth profile)
- **Email**: The user's email address
- **Role**: Badge indicating `admin` or `user` status
- **Uploads**: The number of CSV files the user has uploaded
- **Last Active**: How long ago the user last signed in (e.g., "2 hours ago")
- **Actions**: Quick-access buttons for role changes and account deletion

#### Available Actions:

##### **Promote / Demote**
- **Button**: "Promote" (for regular users) or "Demote" (for admins)
- **Function**: Changes the user's role between `user` and `admin`
- **Confirmation**: A dialog will appear asking you to confirm the role change
- **Effect**: 
  - **Promote**: Grants full admin access to the dashboard
  - **Demote**: Revokes admin privileges (user retains their data)

##### **Delete User**
- **Button**: Red trash icon
- **Function**: Permanently removes the user and all their uploads
- **Confirmation**: A warning dialog will appear explaining that this action is irreversible
- **Effect**: 
  - Deletes the user account
  - Deletes all their CSV uploads
  - Deletes all transaction records associated with their uploads
- **Safety**: You cannot delete your own account (prevents accidental lockout)

---

### 3. Upload Activity Tab

The **Upload Activity** tab shows a real-time feed of all CSV uploads across the entire platform.

#### Table Columns:
- **File Name**: The original name of the uploaded CSV file
- **User**: The name and email of the user who uploaded the file
- **Records**: The number of transaction records in the upload
- **Uploaded**: How long ago the file was uploaded (e.g., "5 minutes ago")

#### Use Cases:
- **Monitor Data Quality**: Identify unusually large or small uploads
- **Track User Engagement**: See which users are actively using the tool
- **Audit Trail**: Maintain a record of all data ingestion events
- **Support Troubleshooting**: Quickly locate a specific upload when a user reports an issue

---

## Security & Permissions

### Role Hierarchy
The system uses a simple two-tier role model:

1. **User** (Default)
   - Can upload CSV files
   - Can view their own data and reports
   - **Cannot** access the admin dashboard
   - **Cannot** view other users' data

2. **Admin**
   - All user permissions
   - Full access to the admin dashboard
   - Can view all users and their uploads
   - Can promote/demote other users
   - Can delete user accounts
   - **Cannot** delete their own account

### Backend Enforcement
- All admin endpoints are protected by the `adminProcedure` middleware
- Requests from non-admin users return a `403 Forbidden` error
- Frontend access control is enforced via the `useAuth()` hook

### Best Practices
- **Limit Admin Accounts**: Only grant admin access to trusted personnel
- **Regular Audits**: Periodically review the list of admin users
- **Use Database Backups**: Before making bulk changes, ensure backups are current
- **Test in Staging**: If possible, test role changes in a non-production environment first

---

## Common Use Cases

### Scenario 1: Onboarding a New Brokerage
**Goal**: Set up a new brokerage client with admin access

1. The brokerage owner signs in for the first time (OAuth creates their account with `user` role)
2. You (as system admin) navigate to `/admin`
3. Go to the "User Management" tab
4. Find the new user by email
5. Click "Promote" to grant them admin access
6. Confirm the role change
7. The brokerage owner can now manage their team's uploads

---

### Scenario 2: Investigating Data Issues
**Goal**: A user reports that their upload is missing transactions

1. Navigate to `/admin`
2. Go to the "Upload Activity" tab
3. Search for the user's name or email in the table
4. Identify the problematic upload by file name and timestamp
5. Note the record count (if it's unexpectedly low, the issue may be in the CSV format)
6. Cross-reference with the user's original file to diagnose the issue

---

### Scenario 3: Removing Inactive Users
**Goal**: Clean up accounts that haven't been used in 6+ months

1. Navigate to `/admin`
2. Go to the "User Management" tab
3. Sort by "Last Active" (users with the oldest timestamps appear first)
4. Review each inactive user:
   - Check their upload count (if zero, they may have never used the tool)
   - Confirm they are no longer with the organization
5. Click the red trash icon to delete the account
6. Confirm the deletion in the dialog

---

### Scenario 4: Monitoring System Growth
**Goal**: Track platform adoption over time

1. Navigate to `/admin`
2. Review the top stat cards:
   - **Total Users**: Compare against last week/month
   - **Total Uploads**: Measure engagement trends
   - **Total Records**: Understand data volume growth
3. Export the data (future feature) or take manual notes for reporting

---

## Technical Architecture

### Backend (tRPC Procedures)
All admin functionality is exposed via the `admin` router in `server/adminRouter.ts`:

- **`admin.getStats`**: Aggregates user and upload counts
- **`admin.listUsers`**: Retrieves all users with their upload counts
- **`admin.listAllUploads`**: Retrieves all uploads across all users
- **`admin.updateUserRole`**: Changes a user's role
- **`admin.deleteUser`**: Deletes a user and their data

### Frontend (React Component)
The admin dashboard UI is located at `client/src/pages/AdminDashboard.tsx`:

- **Authentication Check**: Uses `useAuth()` to verify admin role
- **Data Fetching**: Uses `trpc.admin.*` hooks to load data
- **Real-Time Updates**: Automatically refetches data after mutations
- **Responsive Design**: Works on desktop and tablet devices

### Database Schema
The admin dashboard relies on three core tables:

1. **`users`**: Stores user accounts and roles
2. **`uploads`**: Stores metadata about CSV uploads
3. **`transactions`**: Stores individual transaction records (linked to uploads)

---

## Troubleshooting

### Issue: "Access Denied" when visiting `/admin`
**Cause**: Your account does not have the `admin` role

**Solution**:
1. Ask an existing admin to promote your account
2. OR manually update the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

### Issue: Stats cards show "0" or incorrect numbers
**Cause**: Database connection issue or empty database

**Solution**:
1. Check the dev server logs for database errors
2. Verify the `DATABASE_URL` environment variable is set correctly
3. Run `pnpm db:push` to ensure the schema is up to date
4. Restart the dev server

---

### Issue: User list is empty
**Cause**: No users have signed in yet

**Solution**:
1. Sign in with at least one user account (OAuth creates the user automatically)
2. Refresh the admin dashboard
3. The new user should appear in the "User Management" tab

---

### Issue: Cannot delete a specific user
**Cause**: You're trying to delete your own account

**Solution**:
- The system prevents self-deletion to avoid accidental lockout
- Ask another admin to delete your account if needed

---

## Future Enhancements

The following features are planned for future releases:

1. **Export to CSV**: Download user and upload data as CSV files
2. **Advanced Filtering**: Search and filter users by name, email, or upload count
3. **Pagination**: Handle large user lists more efficiently
4. **Activity Logs**: Track all admin actions (role changes, deletions) for audit purposes
5. **Bulk Actions**: Select multiple users for batch role changes or deletions
6. **Usage Analytics**: Charts showing user growth, upload trends, and peak usage times
7. **Email Notifications**: Alert admins when new users sign up or when uploads fail

---

## Support & Feedback

If you encounter issues with the admin dashboard or have feature requests, please contact the development team or submit feedback through the appropriate channels.

---

**Last Updated**: January 11, 2026  
**Version**: 1.0  
**Maintainer**: Dotloop Engineering Team
