-- CreateEnum
CREATE TYPE "DashboardStyle" AS ENUM ('STYLE1', 'STYLE2');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dashboard_style" "DashboardStyle" NOT NULL DEFAULT 'STYLE1';
