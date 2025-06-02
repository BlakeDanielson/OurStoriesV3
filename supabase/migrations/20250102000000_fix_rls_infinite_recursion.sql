-- Fix RLS Infinite Recursion Issue
-- This migration fixes the infinite recursion detected in policy for relation "users"
-- by simplifying admin policies and removing circular references

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all child profiles" ON public.child_profiles;
DROP POLICY IF EXISTS "Admins can view all books" ON public.books;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;

-- Create a simple function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON au.id = u.id
    WHERE au.id = auth.uid() AND u.role = 'admin'
  );
$$;

-- Create new admin policies that don't cause recursion
-- For users table - allow admins to view all users
CREATE POLICY "Admins can view all users fixed"
  ON public.users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM public.users u 
      WHERE u.role = 'admin' AND u.id = auth.uid()
    )
  );

-- For child_profiles table - allow admins to view all child profiles
CREATE POLICY "Admins can view all child profiles fixed"
  ON public.child_profiles FOR SELECT
  USING (public.is_admin_simple());

-- For books table - allow admins to view all books
CREATE POLICY "Admins can view all books fixed"
  ON public.books FOR SELECT
  USING (public.is_admin_simple());

-- For user_feedback table - allow admins to view all feedback
CREATE POLICY "Admins can view all feedback fixed"
  ON public.user_feedback FOR SELECT
  USING (public.is_admin_simple());

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.is_admin_simple() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin_simple() IS 'Simple admin check function that avoids RLS recursion by using auth.users directly'; 