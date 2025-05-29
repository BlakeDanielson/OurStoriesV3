#!/bin/bash

# OAuth Setup Script for ourStories
# This script helps set up OAuth providers for local development

echo "🔐 OAuth Provider Setup for ourStories"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OAuth Provider Credentials
# Google OAuth - Get from https://console.developers.google.com/
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret

# GitHub OAuth - Get from https://github.com/settings/applications/new
GITHUB_OAUTH_CLIENT_ID=your_github_oauth_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_oauth_client_secret

# Facebook OAuth - Get from https://developers.facebook.com/apps/
FACEBOOK_OAUTH_CLIENT_ID=your_facebook_oauth_client_id
FACEBOOK_OAUTH_CLIENT_SECRET=your_facebook_oauth_client_secret

# Optional: OpenAI API Key for Supabase Studio AI features
OPENAI_API_KEY=your_openai_api_key
EOF
    echo "✅ Created .env.local file with template variables"
else
    echo "⚠️  .env.local already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔗 Set up OAuth applications:"
echo "   • Google: https://console.developers.google.com/"
echo "   • GitHub: https://github.com/settings/applications/new"
echo "   • Facebook: https://developers.facebook.com/apps/"
echo ""
echo "2. 📝 Update .env.local with your OAuth credentials"
echo ""
echo "3. 🔧 Configure redirect URIs in each OAuth provider:"
echo "   • Local: http://localhost:3000/auth/callback"
echo "   • Local: http://127.0.0.1:3000/auth/callback"
echo ""
echo "4. 🚀 Start development servers:"
echo "   • supabase start"
echo "   • npm run dev"
echo ""
echo "5. 🧪 Test OAuth flows at http://localhost:3000/auth/signin"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   docs/authentication/oauth-setup.md"
echo ""
echo "🔐 OAuth providers configured in supabase/config.toml:"
echo "   ✅ Google OAuth"
echo "   ✅ GitHub OAuth"
echo "   ✅ Facebook OAuth"
echo ""
echo "Happy coding! 🎉" 