# Development Email Testing Guide

## Overview

BarangayLink supports email verification for user registration, but for development purposes, you can test the complete flow without setting up a real email service. The system automatically falls back to "Console Mode" when email configuration is not available.

## Current Setup Status

✅ **Console Mode Active** - Your system is currently configured to run in development mode where emails are printed to the console instead of being sent.

## How Console Mode Works

### What Happens During Registration

1. **User registers** through the frontend
2. **Backend processes** the registration
3. **Email service detects** no SMTP configuration
4. **Email content is printed** to the backend console
5. **User can manually verify** using the console output

### Console Output Example

When a user registers, you'll see output like this in your backend console:

```
=== EMAIL VERIFICATION (CONSOLE MODE) ===
To: user@example.com
Subject: Verify Your BarangayLink Account
Verification URL: http://localhost:3000/verify/abc123def456ghi789
==========================================
```

## Testing the Complete Flow

### Step 1: Start the Backend Server

```bash
python scripts/servers/run_backend.py
```

### Step 2: Register a Test User

1. Open your frontend application
2. Go to the registration page
3. Fill out the registration form with test data
4. Submit the form

### Step 3: Check Backend Console

Look for the email verification output in your backend console. It will show:
- **To:** The email address you used
- **Subject:** "Verify Your BarangayLink Account"
- **Verification URL:** The link needed to verify the account

### Step 4: Verify the Account

1. **Copy the verification URL** from the console output
2. **Paste it in your browser** (or click it if it's clickable)
3. **You should see** a success message confirming email verification

### Step 5: Test Login

1. Go to the login page
2. Use the credentials you registered with
3. You should be able to log in (after admin approval)

## What You Can Test

### ✅ Fully Testable Features

- **User Registration** - Complete form submission
- **Email Verification** - Manual verification via console URL
- **Account Status Flow** - Pending → Verified → Approved
- **Admin Approval** - Approve/reject users
- **Login Process** - After verification and approval
- **Profile Management** - Update user information
- **All Core Features** - Documents, benefits, marketplace, etc.

### 📧 Email-Related Features

- **Verification Emails** - Content and URLs (console only)
- **Approval Emails** - Sent when admin approves/rejects
- **Document Emails** - When documents are ready
- **Email Templates** - HTML formatting and content

## Console Mode Benefits

### ✅ Advantages for Development

- **No Email Setup Required** - Works immediately
- **Fast Testing** - No waiting for real emails
- **Full Feature Access** - Test everything except actual email delivery
- **Easy Debugging** - See exactly what emails would be sent
- **No External Dependencies** - Works offline
- **Safe Testing** - No risk of sending emails to real addresses

### 📝 What You See

- **Complete email content** (HTML and text versions)
- **All email metadata** (to, from, subject)
- **Verification URLs** ready to use
- **Email templates** in action
- **Error handling** for email failures

## Switching to Production Email

When you're ready for production, you can:

### Option 1: Use the Setup Script

```bash
python scripts/admin/setup_email.py
```

### Option 2: Manual Configuration

Add to your `backend/.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### Option 3: Keep Console Mode

For development/testing environments, console mode is perfectly fine and recommended.

## Troubleshooting

### Common Issues

**Q: I don't see the console output**
- Make sure your backend server is running
- Check that you're looking at the correct terminal window
- Verify the registration was successful

**Q: The verification URL doesn't work**
- Make sure your frontend is running on `http://localhost:3000`
- Check that the URL is copied correctly
- Verify the token hasn't expired (24-hour limit)

**Q: User can't login after verification**
- Check if the user status is "pending" (needs admin approval)
- Verify the email verification was successful
- Check the user's status in the admin panel

### Debugging Tips

1. **Check Backend Logs** - Look for any error messages
2. **Verify Database** - Check if user was created successfully
3. **Test URLs Manually** - Copy verification URLs to browser
4. **Check User Status** - Verify email_verified field in database

## Development Workflow

### Recommended Testing Sequence

1. **Register Test User** → Check console output
2. **Verify Email** → Use console URL
3. **Login Attempt** → Should work after verification
4. **Admin Approval** → Approve user in admin panel
5. **Full Login** → Complete access to features
6. **Test Features** → Documents, benefits, marketplace, etc.

### Multiple Test Users

Create several test users with different:
- **Email addresses** (test1@example.com, test2@example.com)
- **Roles** (if testing admin features)
- **Barangays** (if testing location-based features)

## Production Considerations

When moving to production:

1. **Set up real email service** (Gmail, Outlook, etc.)
2. **Configure proper SMTP settings**
3. **Test email delivery** with real email addresses
4. **Set up email monitoring** and error handling
5. **Configure proper frontend URL** for verification links

## Summary

Console mode is perfect for development because it:
- ✅ **Works immediately** without email setup
- ✅ **Shows all email content** for testing
- ✅ **Provides verification URLs** for manual testing
- ✅ **Allows complete feature testing**
- ✅ **Is safe and reliable** for development

You can develop and test all features of BarangayLink without ever setting up email, then configure real email when you're ready for production deployment.
