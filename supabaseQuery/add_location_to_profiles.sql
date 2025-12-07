DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT DEFAULT NULL;
    END IF;
END $$;
