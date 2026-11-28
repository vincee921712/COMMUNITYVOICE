CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone_number,
    address,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''), 'Resident'),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'phone_number', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'address', ''), 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'),
    'resident'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.profiles (id, full_name, email, phone_number, address, role)
SELECT
  users.id,
  COALESCE(NULLIF(BTRIM(users.raw_user_meta_data ->> 'full_name'), ''), NULLIF(SPLIT_PART(COALESCE(users.email, ''), '@', 1), ''), 'Resident'),
  users.email,
  NULLIF(users.raw_user_meta_data ->> 'phone_number', ''),
  COALESCE(NULLIF(users.raw_user_meta_data ->> 'address', ''), 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'),
  'resident'
FROM auth.users AS users
LEFT JOIN public.profiles AS profiles ON profiles.id = users.id
WHERE profiles.id IS NULL
ON CONFLICT (id) DO NOTHING;

REVOKE UPDATE, INSERT, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone_number, address, updated_at)
ON public.profiles TO authenticated;
