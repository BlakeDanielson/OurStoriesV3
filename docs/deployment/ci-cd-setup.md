# CI/CD Pipeline Setup

This document outlines the continuous integration and deployment pipeline for the ourStories project.

## Overview

Our CI/CD pipeline consists of three main workflows:

1. **CI (Continuous Integration)** - Testing, linting, and build verification
2. **Deploy** - Automated deployment to staging and production
3. **Security** - Security scanning and vulnerability detection

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

- **Test & Quality Checks**: Runs on Node.js 18.x and 20.x
  - Type checking with TypeScript
  - ESLint code linting
  - Prettier formatting checks
  - Jest unit tests with coverage
  - Coverage upload to Codecov
- **Build Verification**: Verifies production build
- **E2E Tests**: Playwright end-to-end testing

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**

- Push to `main` branch (auto-deploy to staging)
- Manual workflow dispatch for staging/production

**Jobs:**

- **Deploy to Staging**: Automatic deployment on main branch
- **Deploy to Production**: Manual deployment only
- **Notify**: Slack notifications for deployment status

### 3. Security Workflow (`.github/workflows/security.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily scheduled scan at 2 AM UTC

**Jobs:**

- **Dependency Scan**: npm audit and Snyk security scanning
- **CodeQL Analysis**: GitHub's semantic code analysis
- **Secret Scan**: TruffleHog secret detection

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Deployment Secrets

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Environment Variables

- `STAGING_DATABASE_URL` - Staging database connection string
- `STAGING_NEXTAUTH_SECRET` - Staging NextAuth secret
- `STAGING_NEXTAUTH_URL` - Staging NextAuth URL
- `PRODUCTION_DATABASE_URL` - Production database connection string
- `PRODUCTION_NEXTAUTH_SECRET` - Production NextAuth secret
- `PRODUCTION_NEXTAUTH_URL` - Production NextAuth URL
- `OPENAI_API_KEY` - OpenAI API key for AI features

### Security & Monitoring

- `CODECOV_TOKEN` - Codecov upload token
- `SNYK_TOKEN` - Snyk security scanning token
- `SLACK_WEBHOOK` - Slack webhook for notifications

## Environment Setup

### Vercel Environment Variables

Set these in your Vercel dashboard:

**Staging:**

- `NEXT_PUBLIC_APP_ENV=staging`
- `DATABASE_URL` (from secrets)
- `NEXTAUTH_SECRET` (from secrets)
- `NEXTAUTH_URL` (from secrets)
- `OPENAI_API_KEY` (from secrets)

**Production:**

- `NEXT_PUBLIC_APP_ENV=production`
- `DATABASE_URL` (from secrets)
- `NEXTAUTH_SECRET` (from secrets)
- `NEXTAUTH_URL` (from secrets)
- `OPENAI_API_KEY` (from secrets)

## Testing Strategy

### Unit Tests

- Jest with React Testing Library
- Coverage reporting with Codecov
- Minimum 80% coverage requirement

### E2E Tests

- Playwright for cross-browser testing
- Tests run on Chrome, Firefox, Safari
- Mobile viewport testing
- Accessibility testing

### Security Testing

- Dependency vulnerability scanning
- Static code analysis with CodeQL
- Secret detection with TruffleHog
- Regular security audits

## Deployment Process

### Staging Deployment

1. Push to `main` branch
2. CI pipeline runs automatically
3. If all tests pass, deploy to staging
4. Staging URL: `https://ourstories-staging.vercel.app`

### Production Deployment

1. Navigate to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select "production" environment
5. Confirm deployment
6. Production URL: `https://ourstories.vercel.app`

## Monitoring & Alerts

### Slack Notifications

- Deployment success/failure alerts
- Security scan results
- Build status updates

### Error Tracking

- Vercel Analytics for performance monitoring
- Error boundaries for React error handling
- API error logging

## Best Practices

### Branch Protection

- Require PR reviews before merging
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main branch

### Code Quality

- ESLint and Prettier enforcement
- TypeScript strict mode
- Husky pre-commit hooks
- Automated dependency updates

### Security

- Regular dependency updates
- Secret scanning on all commits
- Security headers in production
- Environment variable validation

## Troubleshooting

### Common Issues

**Build Failures:**

- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for specific errors

**Test Failures:**

- Run tests locally first
- Check for environment-specific issues
- Review test coverage reports

**Deployment Issues:**

- Verify Vercel configuration
- Check environment variable setup
- Review deployment logs

### Getting Help

1. Check the GitHub Actions logs
2. Review Vercel deployment logs
3. Check Slack notifications for alerts
4. Contact the development team

## Future Improvements

- [ ] Add performance testing with Lighthouse CI
- [ ] Implement blue-green deployments
- [ ] Add database migration automation
- [ ] Set up monitoring dashboards
- [ ] Implement feature flag management
