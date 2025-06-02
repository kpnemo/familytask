-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BONUS_TASK_SELF_ASSIGNED';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'AVAILABLE';

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_fkey";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "is_bonus_task" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "assigned_to" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "sms_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
