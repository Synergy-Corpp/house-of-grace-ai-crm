
-- Create a table to store generated account statements
CREATE TABLE public.account_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_number TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by TEXT NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  products_added INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  payments_received NUMERIC DEFAULT 0,
  customers_registered INTEGER DEFAULT 0,
  staff_added INTEGER DEFAULT 0,
  statement_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index for faster queries
CREATE INDEX idx_account_statements_dates ON public.account_statements(start_date, end_date);
CREATE INDEX idx_account_statements_generated_at ON public.account_statements(generated_at);

-- Add RLS policies
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and create statements
CREATE POLICY "Authenticated users can view account statements" 
  ON public.account_statements 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create account statements" 
  ON public.account_statements 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
