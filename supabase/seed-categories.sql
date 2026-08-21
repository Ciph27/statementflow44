-- Zimbabwe-oriented default categories
-- This should be run for each new user after signup

-- Debit Categories (Expenses)
INSERT INTO public.categories (user_id, name, description, side) VALUES
  ($1, 'Compensation Employees', 'Salaries, wages, and employee benefits', 'debit'),
  ($1, 'Communication', 'Telephone, internet, and communication expenses', 'debit'),
  ($1, 'Educational Materials', 'Books, supplies, and educational resources', 'debit'),
  ($1, 'Utilities', 'Water, electricity, and other utility bills', 'debit'),
  ($1, 'Computerisation', 'IT equipment, software, and technology expenses', 'debit'),
  ($1, 'Hospitality', 'Entertainment, food, and accommodation expenses', 'debit'),
  ($1, 'Fertilizers', 'Agricultural inputs and farming supplies', 'debit'),
  ($1, 'Transport', 'Vehicle fuel, maintenance, and travel expenses', 'debit'),
  ($1, 'Rent', 'Office and property rental expenses', 'debit'),
  ($1, 'Insurance', 'Insurance premiums and coverage', 'debit'),
  ($1, 'Office Supplies', 'General office supplies and consumables', 'debit'),
  ($1, 'Professional Fees', 'Legal, accounting, and consulting fees', 'debit'),
  ($1, 'Maintenance Repairs', 'Equipment and facility maintenance', 'debit'),
  ($1, 'Marketing Advertising', 'Marketing campaigns and advertising', 'debit'),
  ($1, 'Bank Charges', 'Bank fees and financial service charges', 'debit'),
  ($1, 'Other Expenses', 'Miscellaneous expenses not categorized elsewhere', 'debit');

-- Credit Categories (Income)
INSERT INTO public.categories (user_id, name, description, side) VALUES
  ($1, 'Sale of Services', 'Revenue from service provision', 'credit'),
  ($1, 'Grants & Donations', 'Grant funding and charitable donations received', 'credit'),
  ($1, 'Other Income', 'Miscellaneous income not categorized elsewhere', 'credit'),
  ($1, 'Interest Income', 'Interest earned from investments and savings', 'credit'),
  ($1, 'Sales Revenue', 'Revenue from product sales', 'credit'),
  ($1, 'Consulting Fees', 'Income from consulting services', 'credit'),
  ($1, 'Rental Income', 'Income from property rentals', 'credit'),
  ($1, 'Dividend Income', 'Dividends from investments', 'credit');

-- Both Categories (can be debit or credit)
INSERT INTO public.categories (user_id, name, description, side) VALUES
  ($1, 'Transfers', 'Internal transfers between accounts', 'both'),
  ($1, 'Adjustments', 'Accounting adjustments and corrections', 'both'),
  ($1, 'Foreign Exchange', 'Currency exchange transactions', 'both'),
  ($1, 'Tax', 'Tax payments and refunds', 'both');