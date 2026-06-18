-- Create RealnameRecord table for realname certification results

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
