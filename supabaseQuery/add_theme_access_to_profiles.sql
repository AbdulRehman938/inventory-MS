-- Add a new boolean column 'theme_access' to profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'theme_access'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN theme_access BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
