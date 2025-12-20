# Azure AD SSO Configuration Guide

## Backend Configuration

### 1. Environment Variables
Create or update the `.env` file in the `backend` directory with the following values:

```env
# Azure AD Configuration
AZURE_CLIENT_ID=ae5a4dac-fce9-4a74-942f-71ca215d5ed7
AZURE_TENANT_ID=bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820
AZURE_CLIENT_SECRET=c404aa1c-4c9e-4c5f-a1ff-0aaa640fff3d
AZURE_REDIRECT_URL=http://localhost:5000/auth/callback

# Session Configuration (Change these in production!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
COOKIE_ENCRYPTION_KEY=12345678901234567890123456789012

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 2. Azure AD Application Setup

In your Azure Portal (https://portal.azure.com), configure the following for your app registration:

#### Authentication Settings:
- **Platform**: Web
- **Redirect URIs**: 
  - `http://localhost:5000/auth/callback` (development)
  - Add your production URL when deploying
- **Front-channel logout URL**: `http://localhost:3000`
- **Implicit grant and hybrid flows**: 
  - ✅ ID tokens
  - ✅ Access tokens

#### API Permissions:
- Microsoft Graph:
  - `User.Read` (Delegated)
  - `email` (Delegated)
  - `openid` (Delegated)
  - `profile` (Delegated)

#### Certificates & Secrets:
- Ensure the client secret matches: `c404aa1c-4c9e-4c5f-a1ff-0aaa640fff3d`

## Frontend Configuration

The Azure AD settings are already configured in `frontend/src/authConfig.js`:

```javascript
Client ID: ae5a4dac-fce9-4a74-942f-71ca215d5ed7
Tenant ID: bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820
```

### Allowed Redirect URIs in Azure Portal:
Add these to your Azure AD app registration:
- `http://localhost:3000` (development)
- Your production domain when deploying

## Running the Application

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Access the Application
- Open browser to `http://localhost:3000`
- Click "Sign in with Microsoft"
- Authenticate with your Azure AD credentials
- You'll be redirected to the dashboard upon successful authentication

## Authentication Flow

1. User clicks "Sign in with Microsoft" button
2. Popup window opens with Microsoft login page
3. User enters Azure AD credentials
4. Microsoft validates and returns ID token
5. Application extracts user information (name, email)
6. User is redirected to dashboard with authenticated session

## Security Notes

⚠️ **IMPORTANT**: Before deploying to production:

1. **Change SESSION_SECRET**: Generate a strong random string
2. **Change COOKIE_ENCRYPTION_KEY**: Use a 32-character random string
3. **Update Redirect URLs**: Add your production domain to Azure AD app registration
4. **Enable HTTPS**: Set `secure: true` for cookies in production
5. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### "Redirect URI mismatch" error
- Ensure the redirect URI in Azure Portal exactly matches your backend URL
- Check that `AZURE_REDIRECT_URL` in `.env` is correct

### "Invalid client secret" error
- Verify the `AZURE_CLIENT_SECRET` in `.env` matches Azure Portal
- Check if the secret has expired in Azure Portal

### User not authenticated after login
- Clear browser cookies and cache
- Check browser console for errors
- Verify session configuration in backend

### CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `server.js`

## Additional Features

### Logout Functionality
Click the "Logout" button in the header to sign out. This will:
1. Clear the local session
2. Sign out from Microsoft account (popup)
3. Redirect to login screen

### User Information
The authenticated user's information is available:
- **Name**: Displayed in dashboard
- **Email**: Shown in header
- **Role**: Default "Recruiter" (can be customized)

## Team Information
- **Team Name**: AITalentSystemsTeam
- **Client ID**: ae5a4dac-fce9-4a74-942f-71ca215d5ed7
- **Tenant ID**: bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820
