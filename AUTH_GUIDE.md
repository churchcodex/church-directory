# Authentication System Documentation

## Overview

This church directory application now includes a complete authentication system with admin capabilities. The system allows an admin to:
- Generate invite links for new users
- Control user access (activate/deactivate)
- Delete users
- Monitor invite token usage

## Features

### User Roles
- **Admin**: Full access to user management and invite generation
- **User**: Access to church directory features

### Authentication Flow
1. Admin generates an invite token
2. Admin shares the signup link with the new user
3. User registers with the invite token
4. User can login with their credentials
5. Admin can revoke access at any time

## Setup Instructions

### 1. Environment Variables

The `.env` file has been updated with NextAuth configuration:

```env
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

**Important**: Generate a secure secret for production:
```bash
openssl rand -base64 32
```

### 2. Create Initial Admin User

Run the following command to create your first admin user:

```bash
npm run create-admin
```

This will create an admin with default credentials:
- **Email**: admin@church.com
- **Password**: admin123

Or specify custom credentials:
```bash
npm run create-admin your-email@church.com your-password
```

**⚠️ Important**: Change the default password immediately after first login!

### 3. Generate a Proper NEXTAUTH_SECRET

For production, generate a secure secret:

```bash
# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Update your `.env` file with the generated secret.

## Usage Guide

### Admin Workflow

#### 1. Login as Admin
Navigate to `/login` and use your admin credentials.

#### 2. Access Admin Dashboard
Click on the "Admin" link in the navigation bar or go to `/admin/users`.

#### 3. Generate Invite Link
- Click "Generate Invite Link" button
- The signup URL will be automatically copied to your clipboard
- Share this link with the new user

#### 4. Manage Users
- **View all users**: See registered users and their status
- **Revoke Access**: Click "Revoke Access" to deactivate a user
- **Grant Access**: Click "Grant Access" to reactivate a user
- **Delete User**: Permanently remove a user from the system

#### 5. Monitor Invite Tokens
View all generated tokens with their:
- Token string
- Creation and expiration dates
- Usage status (Active, Used, or Expired)
- User who used the token

### User Workflow

#### 1. Receive Invite Link
Get the signup link from an admin.

#### 2. Sign Up
- Click the invite link (format: `/signup?token=xxx`)
- Enter your email and password
- Submit the registration form

#### 3. Login
- Navigate to `/login`
- Enter your credentials
- Access the church directory

#### 4. Logout
Click the "Logout" button in the navigation bar.

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user with an invite token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "token": "invite-token-string"
}
```

#### POST `/api/auth/invite`
Generate a new invite token (Admin only).

**Body:**
```json
{
  "expiresInDays": 7
}
```

#### GET `/api/auth/invite`
Get all invite tokens (Admin only).

### User Management Endpoints

#### GET `/api/users`
Get all users (Admin only).

#### PATCH `/api/users/[id]`
Update user access status (Admin only).

**Body:**
```json
{
  "isActive": true
}
```

#### DELETE `/api/users/[id]`
Delete a user (Admin only).

## Security Features

### Password Security
- Passwords are hashed using bcryptjs with 10 salt rounds
- Minimum password length: 6 characters
- Passwords are never stored in plain text

### Session Management
- JWT-based sessions
- Secure session cookies
- Automatic session expiration

### Access Control
- Middleware protects all routes
- Role-based access for admin features
- Inactive users cannot login

### Invite Token Security
- Cryptographically secure random tokens
- Tokens expire after 7 days (configurable)
- Single-use tokens
- Cannot reuse expired or used tokens

## Route Protection

The middleware protects the following routes:
- `/` - Requires authentication
- `/churches/*` - Requires authentication
- `/clergy/*` - Requires authentication
- `/admin/*` - Requires admin role
- `/login` - Redirects authenticated users
- `/signup` - Redirects authenticated users

## Database Models

### User Model
```typescript
{
  email: string;
  password: string; // hashed
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### InviteToken Model
```typescript
{
  token: string;
  createdBy: ObjectId; // User reference
  isUsed: boolean;
  usedBy?: ObjectId; // User reference
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Troubleshooting

### "Invalid credentials" error
- Verify email and password are correct
- Check if the user account is active

### "Your account has been deactivated"
- Contact an admin to reactivate your account

### "Invalid invite token"
- Verify the token is correct
- Check if the token has expired
- Ensure the token hasn't been used already

### Cannot access admin features
- Verify you're logged in as an admin
- Check the `role` field in your user document

## Production Deployment Checklist

- [ ] Generate a strong NEXTAUTH_SECRET
- [ ] Update NEXTAUTH_URL with production domain
- [ ] Change default admin credentials
- [ ] Enable HTTPS
- [ ] Set secure cookie options in NextAuth config
- [ ] Review and adjust token expiration times
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up monitoring for failed login attempts
- [ ] Configure email notifications for admin actions

## Best Practices

1. **Admin Management**
   - Create admin accounts sparingly
   - Use strong, unique passwords
   - Regularly review user access
   - Monitor invite token usage

2. **Invite Links**
   - Set appropriate expiration times
   - Share links through secure channels
   - Revoke access if a token is compromised
   - Generate new tokens for each user

3. **User Management**
   - Regularly audit active users
   - Deactivate users instead of deleting when possible
   - Document reasons for access revocation
   - Keep invite token records for audit purposes

## Support

For issues or questions about the authentication system:
1. Check the troubleshooting section
2. Review the API endpoint documentation
3. Verify environment variables are correctly set
4. Check the console for error messages
