-- 1. Update the default role on the users table
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'subscriber';

-- 2. Update the trigger function that creates users upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'subscriber');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. (Optional) Run this to promote your specific account to admin
-- Replace with your actual email address
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
