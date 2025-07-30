
-- Add RLS policies for the users table to allow authenticated users to create accounts
CREATE POLICY "Allow authenticated users to insert users" 
  ON public.users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view users" 
  ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to update users" 
  ON public.users 
  FOR UPDATE 
  TO authenticated 
  USING (true);
