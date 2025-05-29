# Email Verification and Password Reset Setup

This guide covers the complete setup and configuration of email verification and password reset functionality in the ourStories application.

## Overview

The email verification and password reset system includes:

- Email confirmation for new user signups
- Password reset via email
- Email change confirmation
- Custom email templates
- Email verification reminders

## Configuration

### Supabase Email Settings

The email configuration is located in `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
secure_password_change = true
max_frequency = "1s"
otp_length = 6
otp_expiry = 3600
```

#### Key Settings Explained

- `enable_confirmations = true`: Requires email verification for new signups
- `secure_password_change = true`: Requires recent authentication for password changes
- `double_confirm_changes = true`: Requires confirmation on both old and new email for email changes
- `otp_expiry = 3600`: Email links expire after 1 hour (3600 seconds)

### Email Templates

Custom email templates are configured in `supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Welcome to ourStories - Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your ourStories password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.email_change]
subject = "Confirm your new email address"
content_path = "./supabase/templates/email_change.html"

[auth.email.template.invite]
subject = "You have been invited to ourStories"
content_path = "./supabase/templates/invite.html"
```

## Email Templates

### Template Variables

All email templates support these Supabase variables:

- `{{ .ConfirmationURL }}`: The action URL for the email
- `{{ .Email }}`: The recipient's email address
- `{{ .SiteURL }}`: Your site's base URL

### Template Files

1. **Confirmation Email** (`supabase/templates/confirmation.html`)

   - Sent when users sign up
   - Includes welcome message and account benefits
   - 24-hour expiration notice

2. **Password Recovery** (`supabase/templates/recovery.html`)

   - Sent when users request password reset
   - Includes security tips
   - 1-hour expiration notice

3. **Email Change** (`supabase/templates/email_change.html`)

   - Sent when users change their email
   - Explains the process and consequences
   - 24-hour expiration notice

4. **Invitation** (`supabase/templates/invite.html`)
   - Sent when users are invited to join
   - Highlights platform features
   - 7-day expiration notice

## Application Components

### Pages

#### Reset Password Page (`/auth/reset-password`)

- Email input form with validation
- Success state with instructions
- Error handling and user feedback
- Link back to sign-in page

#### Update Password Page (`/auth/update-password`)

- New password form with confirmation
- Password strength requirements
- Authentication check (requires valid session)
- Success state with redirect to dashboard

### Components

#### EmailVerificationBanner

- Shows when user email is not verified
- Resend verification option (simulated)
- Dismissible banner
- Integration with auth context

### Auth Context Integration

The auth context (`lib/auth/context.tsx`) includes:

```typescript
// Reset password function
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  })
  return { success: !error, error: error?.message }
}

// Update password function
const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password })
  return { success: !error, error: error?.message }
}
```

### Callback Handling

The auth callback handler (`app/auth/callback/page.tsx`) supports:

- `type=recovery`: Redirects to update password page
- `type=signup`: Redirects to dashboard with welcome message
- `type=email_change`: Redirects to profile with confirmation

## SMTP Configuration (Production)

For production environments, configure SMTP in `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "admin@yourdomain.com"
sender_name = "ourStories"
```

### Environment Variables

Add to your `.env.local`:

```bash
# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### Recommended SMTP Providers

1. **SendGrid**

   - Reliable delivery
   - Good free tier
   - Easy integration

2. **Mailgun**

   - Developer-friendly
   - Good analytics
   - Competitive pricing

3. **Amazon SES**
   - Cost-effective
   - High deliverability
   - AWS integration

## Testing

### Local Development

1. **Start Supabase locally:**

   ```bash
   npx supabase start
   ```

2. **Check email settings:**

   - Visit Supabase Studio (usually http://localhost:54323)
   - Go to Authentication > Settings
   - Verify email confirmation is enabled

3. **Test email flows:**
   - Sign up with a new account
   - Check Supabase logs for email content
   - Test password reset flow
   - Verify callback handling

### Email Testing Tools

1. **Mailhog** (for local development):

   ```bash
   docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. **Mailtrap** (staging environment):
   - Create account at mailtrap.io
   - Use SMTP credentials in staging

### Test Scenarios

1. **Email Confirmation:**

   - Sign up with new email
   - Verify email is sent
   - Click confirmation link
   - Verify redirect to dashboard

2. **Password Reset:**

   - Request password reset
   - Verify email is sent
   - Click reset link
   - Update password successfully
   - Verify redirect to dashboard

3. **Email Change:**
   - Change email in profile
   - Verify confirmation emails sent to both addresses
   - Confirm new email
   - Verify email is updated

## Security Considerations

### Email Security

1. **Link Expiration:**

   - Confirmation links expire in 24 hours
   - Password reset links expire in 1 hour
   - Prevents replay attacks

2. **Rate Limiting:**

   - Maximum 2 emails per hour per user
   - Prevents email spam

3. **Secure Password Requirements:**
   - Minimum 8 characters
   - Must include uppercase, lowercase, number, and symbol
   - Enforced on both client and server

### Best Practices

1. **Email Validation:**

   - Validate email format on client and server
   - Check for disposable email domains
   - Implement email verification

2. **User Experience:**

   - Clear error messages
   - Loading states during operations
   - Success confirmations

3. **Monitoring:**
   - Track email delivery rates
   - Monitor failed authentication attempts
   - Log security events

## Troubleshooting

### Common Issues

1. **Emails not being sent:**

   - Check SMTP configuration
   - Verify environment variables
   - Check Supabase logs

2. **Email links not working:**

   - Verify redirect URLs
   - Check callback handler
   - Ensure proper URL encoding

3. **Template not loading:**
   - Check file paths in config.toml
   - Verify template syntax
   - Check Supabase logs for errors

### Debug Steps

1. **Check Supabase logs:**

   ```bash
   npx supabase logs
   ```

2. **Verify configuration:**

   ```bash
   npx supabase status
   ```

3. **Test email templates:**
   - Use Supabase Studio to send test emails
   - Check template rendering
   - Verify variable substitution

## Production Deployment

### Pre-deployment Checklist

- [ ] SMTP provider configured
- [ ] Environment variables set
- [ ] Email templates tested
- [ ] Domain verification completed
- [ ] SPF/DKIM records configured
- [ ] Rate limiting configured
- [ ] Monitoring set up

### Post-deployment Verification

1. Test all email flows in production
2. Monitor email delivery rates
3. Check for any configuration issues
4. Verify template rendering
5. Test callback URLs

## Support

For additional help:

- Check Supabase documentation
- Review application logs
- Contact development team
- Submit support ticket

---

_Last updated: [Current Date]_
_Version: 1.0_
