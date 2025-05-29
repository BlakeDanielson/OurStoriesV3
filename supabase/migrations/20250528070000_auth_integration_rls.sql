-- Auth Integration and RLS Enhancement Migration
-- This migration ensures proper integration between Supabase Auth and our RLS policies

-- Ensure the handle_new_user trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')::user_role
  );
  RETURN NEW;
END;
$$;

-- Create the trigger to automatically create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Add additional RLS policies for better security

-- Policy to allow users to view their own profile by auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile by auth uid" ON public.users;
CREATE POLICY "Users can view their own profile by auth uid"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy to allow users to update their own profile by auth.uid()
DROP POLICY IF EXISTS "Users can update their own profile by auth uid" ON public.users;
CREATE POLICY "Users can update their own profile by auth uid"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Enhanced policy for child profile creation with better validation
DROP POLICY IF EXISTS "Parents can create children's profiles enhanced" ON public.child_profiles;
CREATE POLICY "Parents can create children's profiles enhanced"
  ON public.child_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

-- Enhanced policy for book creation with better validation
DROP POLICY IF EXISTS "Users can create books for their children enhanced" ON public.books;
CREATE POLICY "Users can create books for their children enhanced"
  ON public.books FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      JOIN public.users u ON cp.parent_id = u.id
      WHERE cp.id = child_profile_id 
      AND u.id = auth.uid()
      AND u.role = 'parent'
    )
  );

-- Enhanced policy for user feedback with better validation
DROP POLICY IF EXISTS "Users can create their own feedback enhanced" ON public.user_feedback;
CREATE POLICY "Users can create their own feedback enhanced"
  ON public.user_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.books b
      JOIN public.child_profiles cp ON b.child_profile_id = cp.id
      WHERE b.id = book_id AND cp.parent_id = auth.uid()
    )
  );

-- Add policy for OAuth users to ensure they can access their data
DROP POLICY IF EXISTS "OAuth users can access their data" ON public.users;
CREATE POLICY "OAuth users can access their data"
  ON public.users FOR ALL
  USING (auth.uid() = id);

-- Function to check if user is admin (for admin policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Enhanced admin policies using the helper function
DROP POLICY IF EXISTS "Admins can view all users enhanced" ON public.users;
CREATE POLICY "Admins can view all users enhanced"
  ON public.users FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all child profiles enhanced" ON public.child_profiles;
CREATE POLICY "Admins can view all child profiles enhanced"
  ON public.child_profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all books enhanced" ON public.books;
CREATE POLICY "Admins can view all books enhanced"
  ON public.books FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all feedback enhanced" ON public.user_feedback;
CREATE POLICY "Admins can view all feedback enhanced"
  ON public.user_feedback FOR SELECT
  USING (public.is_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_feedback TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_books_with_progress(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_children_with_book_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reading_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_books(uuid, text, text, uuid, book_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_book_status(uuid, book_status, integer) TO authenticated;

-- Add indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_auth ON public.child_profiles(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_auth ON public.user_feedback(user_id) WHERE user_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new auth user is created';
COMMENT ON FUNCTION public.is_admin() IS 'Helper function to check if the current user has admin role';
COMMENT ON POLICY "Users can view their own profile by auth uid" ON public.users IS 'Allows users to view their own profile using auth.uid()';
COMMENT ON POLICY "Parents can create children's profiles enhanced" ON public.child_profiles IS 'Enhanced policy for creating child profiles with role validation'; 