# Supabase Project Setup

## Project Details

- **Project Name**: ourstories-v3
- **Project ID**: dpwkarpiiprdjwsxkodv
- **Organization**: ArtistMerch
- **Region**: us-east-1
- **Database Host**: db.dpwkarpiiprdjwsxkodv.supabase.co
- **PostgreSQL Version**: 15.8.1.093

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dpwkarpiiprdjwsxkodv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwd2thcnBpaXByZGp3c3hrb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTM1MDUsImV4cCI6MjA2Mzk4OTUwNX0.o3-mkKbHNiin_sLK7kaX7j68-ZKvQtaPNagmh3y7Hu8
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Getting the Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/dpwkarpiiprdjwsxkodv
2. Navigate to Settings > API
3. Copy the `service_role` key (keep this secret!)
4. Add it to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

## Client Configuration

The Supabase client is configured in `lib/supabase.ts` with multiple client types:

- **Browser Client**: For client-side components
- **Server Client**: For server-side components with cookie handling
- **Middleware Client**: For Next.js middleware
- **Admin Client**: For server-side operations requiring elevated permissions

## Next Steps

1. Add the environment variables to your `.env` file
2. Get the service role key from the Supabase dashboard
3. Create the database schema using migrations
4. Set up Row Level Security (RLS) policies
5. Configure Supabase Storage for image uploads

## Project Status

- ✅ Project created
- ✅ Client configuration setup
- ⏳ Environment variables (manual step required)
- ⏳ Database schema creation
- ⏳ RLS policies setup
- ⏳ Storage configuration
