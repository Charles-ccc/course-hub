-- Add RealnameRecord table and Student.name column if not present

-- Add name column to Student (nullable, for realname certification result)
ALTER TABLE `Student`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(191) NULL;

-- Add realnameStatus column to Student if not present
ALTER TABLE `Student`
  ADD COLUMN IF NOT EXISTS `realnameStatus` ENUM('UNVERIFIED','VERIFIED','REJECTED') NOT NULL DEFAULT 'UNVERIFIED';

-- Create RealnameRecord table
CREATE TABLE IF NOT EXISTS `RealnameRecord` (
  `id`         VARCHAR(191) NOT NULL,
  `studentId`  VARCHAR(191) NOT NULL,
  `certifyId`  VARCHAR(191) NOT NULL,
  `status`     ENUM('UNVERIFIED','VERIFIED','REJECTED') NOT NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RealnameRecord_certifyId_key` (`certifyId`),
  KEY `RealnameRecord_studentId_fkey` (`studentId`),
  CONSTRAINT `RealnameRecord_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
