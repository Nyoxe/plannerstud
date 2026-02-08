-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can create their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Change id column from uuid to text to support existing ID format
ALTER TABLE public.schedules ALTER COLUMN id SET DATA TYPE text;
ALTER TABLE public.schedules ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Create PERMISSIVE policies (default behavior)
CREATE POLICY "Users can view their own schedules" 
ON public.schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules" 
ON public.schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON public.schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON public.schedules 
FOR DELETE 
USING (auth.uid() = user_id);