SET @schema = DATABASE();

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'Salesman'
      AND COLUMN_NAME = 'groupName'
  ) = 0,
  'ALTER TABLE `Salesman` ADD COLUMN `groupName` VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'RefreshToken'
      AND COLUMN_NAME = 'salesmanId'
  ) = 0,
  'ALTER TABLE `RefreshToken` ADD COLUMN `salesmanId` VARCHAR(191) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'RefreshToken'
      AND INDEX_NAME = 'RefreshToken_salesmanId_idx'
  ) = 0,
  'CREATE INDEX `RefreshToken_salesmanId_idx` ON `RefreshToken`(`salesmanId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'RefreshToken'
      AND CONSTRAINT_NAME = 'RefreshToken_salesmanId_fkey'
  ) = 0,
  'ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_salesmanId_fkey` FOREIGN KEY (`salesmanId`) REFERENCES `Salesman`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `Student` (
  `id` VARCHAR(191) NOT NULL,
  `insitutionId` VARCHAR(191) NOT NULL,
  `boundSalesmanId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NOT NULL,
  `realnameStatus` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
  `boundAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Student_phone_key`(`phone`),
  INDEX `Student_insitutionId_idx`(`insitutionId`),
  INDEX `Student_boundSalesmanId_idx`(`boundSalesmanId`),
  CONSTRAINT `Student_insitutionId_fkey`
    FOREIGN KEY (`insitutionId`) REFERENCES `Insitution`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Student_boundSalesmanId_fkey`
    FOREIGN KEY (`boundSalesmanId`) REFERENCES `Salesman`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'studentId'
  ) = 0,
  'ALTER TABLE `Order` ADD COLUMN `studentId` VARCHAR(191) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'Order'
      AND INDEX_NAME = 'Order_studentId_idx'
  ) = 0,
  'CREATE INDEX `Order_studentId_idx` ON `Order`(`studentId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema
      AND TABLE_NAME = 'Order'
      AND CONSTRAINT_NAME = 'Order_studentId_fkey'
  ) = 0,
  'ALTER TABLE `Order` ADD CONSTRAINT `Order_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `Commission` (
  `id` VARCHAR(191) NOT NULL,
  `staffId` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NULL,
  `type` ENUM('CLOSING', 'PERFORMANCE') NOT NULL,
  `periodNo` INTEGER NULL,
  `status` ENUM('PENDING', 'SETTLED', 'HELD', 'CLAWED_BACK') NOT NULL,
  `amountCents` INTEGER NOT NULL,
  `studentName` VARCHAR(191) NOT NULL,
  `courseName` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Commission_staffId_status_idx`(`staffId`, `status`),
  INDEX `Commission_createdAt_idx`(`createdAt`),
  CONSTRAINT `Commission_staffId_fkey`
    FOREIGN KEY (`staffId`) REFERENCES `Salesman`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Commission_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
