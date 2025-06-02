-- Production Migration: Add Bonus Task Features
-- This migration adds support for bonus tasks, self-assignment, and notifications

BEGIN;

-- Add AVAILABLE status to TaskStatus enum
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'AVAILABLE';

-- Add BONUS_TASK_SELF_ASSIGNED to NotificationType enum  
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BONUS_TASK_SELF_ASSIGNED';

-- Make assignedTo nullable to support unassigned bonus tasks
ALTER TABLE "tasks" ALTER COLUMN "assigned_to" DROP NOT NULL;

-- Add isBonusTask field to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_bonus_task" BOOLEAN DEFAULT false NOT NULL;

-- Add SMS notification fields to users table (if not already exists)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_notifications_enabled" BOOLEAN DEFAULT false;

-- Update existing records to have default false for sms_notifications_enabled  
UPDATE "users" SET "sms_notifications_enabled" = false WHERE "sms_notifications_enabled" IS NULL;

-- Make sms_notifications_enabled NOT NULL after setting defaults
ALTER TABLE "users" ALTER COLUMN "sms_notifications_enabled" SET NOT NULL;

-- Create index for bonus task filtering (performance optimization)
CREATE INDEX IF NOT EXISTS "idx_tasks_bonus_available" ON "tasks" ("is_bonus_task", "status") WHERE "is_bonus_task" = true AND "status" = 'AVAILABLE';

COMMIT;