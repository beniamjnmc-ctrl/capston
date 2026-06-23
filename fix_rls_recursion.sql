-- ============================================================
-- FIX: Infinite recursion in "Admin can read all profiles" RLS policy
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop the recursive policy
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;

-- Step 2: Create a SECURITY DEFINER function
-- Runs as postgres (owner), bypasses RLS — no recursion possible
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 3: Recreate the admin policy using the function (non-recursive)
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Step 4: One-time migration — sync role into user_metadata for existing users
-- This ensures the _app.js fallback also works correctly going forward
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE auth.users.id = p.id;
