# OAuth Provider Setup Guide

This guide walks you through setting up OAuth authentication providers for the ourStories application. The application supports Google, GitHub, and Facebook OAuth providers.

## Prerequisites

- Supabase project set up and running
- Access to Google Cloud Console, GitHub Developer Settings, and Facebook Developers
- Environment variables configured in your deployment environment

## OAuth Provider Configuration

### 1. Google OAuth Setup

#### Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`
8. Save and note down the Client ID and Client Secret

#### Step 2: Configure Environment Variables

Add the following environment variables to your deployment:

```bash
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
```

### 2. GitHub OAuth Setup

#### Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: ourStories
   - **Homepage URL**: Your application URL
   - **Authorization callback URL**:
     - For local development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
4. Click "Register application"
5. Note down the Client ID and generate a Client Secret

#### Step 2: Configure Environment Variables

Add the following environment variables to your deployment:

```bash
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret
```

### 3. Facebook OAuth Setup

#### Step 1: Create Facebook Application

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Select "Consumer" as the app type
4. Fill in the app details and create the app
5. In the app dashboard, go to "Settings" > "Basic"
6. Note down the App ID and App Secret
7. Add your domain to "App Domains"
8. In "Facebook Login" settings, add valid OAuth redirect URIs:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

#### Step 2: Configure Environment Variables

Add the following environment variables to your deployment:

```bash
FACEBOOK_OAUTH_CLIENT_ID=your_facebook_app_id
FACEBOOK_OAUTH_CLIENT_SECRET=your_facebook_app_secret
```

## Local Development Setup

### Environment Variables

Create a `.env.local` file in your project root with all OAuth credentials:

```bash
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

# Facebook OAuth
FACEBOOK_OAUTH_CLIENT_ID=your_facebook_app_id
FACEBOOK_OAUTH_CLIENT_SECRET=your_facebook_app_secret
```

### Testing OAuth Flows

1. Start your local development server:

   ```bash
   npm run dev
   ```

2. Navigate to the sign-in page: `http://localhost:3000/auth/signin`

3. Test each OAuth provider:

   - Click "Continue with Google"
   - Click "Continue with GitHub"
   - Click "Continue with Facebook"

4. Verify successful authentication and redirect to the dashboard

## Production Deployment

### Supabase Configuration

The OAuth providers are already configured in `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"
secret = "env(GOOGLE_OAUTH_CLIENT_SECRET)"

[auth.external.github]
enabled = true
client_id = "env(GITHUB_OAUTH_CLIENT_ID)"
secret = "env(GITHUB_OAUTH_CLIENT_SECRET)"

[auth.external.facebook]
enabled = true
client_id = "env(FACEBOOK_OAUTH_CLIENT_ID)"
secret = "env(FACEBOOK_OAUTH_CLIENT_SECRET)"
```

### Environment Variables in Production

Ensure all OAuth environment variables are configured in your production environment:

- **Vercel**: Add to Environment Variables in project settings
- **Netlify**: Add to Environment Variables in site settings
- **Railway/Render**: Add to Environment Variables in service settings

### Redirect URI Configuration

Update OAuth applications with production redirect URIs:

- Replace `http://localhost:3000` with your production domain
- Ensure HTTPS is used for production URLs
- Example: `https://yourdomain.com/auth/callback`

## Security Considerations

### Environment Variables

- Never commit OAuth secrets to version control
- Use environment variable substitution in Supabase config
- Rotate OAuth secrets regularly
- Use different OAuth applications for development and production

### Redirect URI Validation

- Only add trusted domains to OAuth redirect URIs
- Use HTTPS for all production redirect URIs
- Validate redirect URIs match exactly (including trailing slashes)

### COPPA Compliance

- Facebook and Google have specific requirements for apps targeting children
- Ensure compliance with Children's Online Privacy Protection Act (COPPA)
- Consider age verification mechanisms if required

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**

   - Verify redirect URI matches exactly in OAuth provider settings
   - Check for trailing slashes or protocol mismatches
   - Ensure localhost is allowed for development

2. **"Invalid client" error**

   - Verify Client ID and Client Secret are correct
   - Check environment variables are properly set
   - Ensure OAuth application is active/published

3. **"Access denied" error**
   - Check OAuth consent screen configuration
   - Verify required scopes are requested
   - Ensure user has permission to access the application

### Debug Steps

1. Check Supabase Auth logs in the dashboard
2. Verify environment variables are loaded correctly
3. Test OAuth flow in incognito/private browsing mode
4. Check browser developer tools for network errors
5. Verify OAuth provider application settings

## Support

For additional help:

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
