-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "phone" TEXT;
