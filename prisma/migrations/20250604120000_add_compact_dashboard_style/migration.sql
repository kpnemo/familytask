-- Ensure DashboardStyle enum exists (for shadow DB initial setup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DashboardStyle') THEN
    CREATE TYPE "DashboardStyle" AS ENUM ('STYLE1', 'STYLE2', 'KIDS_STYLE');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- Add COMPACT value to DashboardStyle enum
ALTER TYPE "DashboardStyle" ADD VALUE IF NOT EXISTS 'COMPACT';
