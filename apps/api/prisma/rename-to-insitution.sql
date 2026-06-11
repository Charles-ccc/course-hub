SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `RefreshToken` DROP FOREIGN KEY `RefreshToken_institutionUserId_fkey`;
ALTER TABLE `Question` DROP FOREIGN KEY `Question_institutionId_fkey`;
ALTER TABLE `SettlementRecord` DROP FOREIGN KEY `SettlementRecord_institutionId_fkey`;
ALTER TABLE `Order` DROP FOREIGN KEY `Order_institutionId_fkey`;
ALTER TABLE `Salesman` DROP FOREIGN KEY `Salesman_institutionId_fkey`;
ALTER TABLE `Course` DROP FOREIGN KEY `Course_institutionId_fkey`;
ALTER TABLE `InstitutionUser` DROP FOREIGN KEY `InstitutionUser_institutionId_fkey`;

ALTER TABLE `InstitutionUser`
  MODIFY COLUMN `role` enum('INSTITUTION_ADMIN','INSITUTION_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INSTITUTION_ADMIN';

UPDATE `InstitutionUser`
SET `role` = 'INSITUTION_ADMIN'
WHERE `role` = 'INSTITUTION_ADMIN';

ALTER TABLE `InstitutionUser`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Course`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Salesman`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Order`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `SettlementRecord`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Question`
  CHANGE COLUMN `institutionId` `insitutionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `RefreshToken`
  CHANGE COLUMN `institutionUserId` `insitutionUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

RENAME TABLE `Institution` TO `Insitution`, `InstitutionUser` TO `InsitutionUser`;

ALTER TABLE `Insitution`
  DROP INDEX `Institution_socialCreditCode_key`,
  ADD UNIQUE KEY `Insitution_socialCreditCode_key` (`socialCreditCode`);

ALTER TABLE `InsitutionUser`
  MODIFY COLUMN `role` enum('INSITUTION_ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INSITUTION_ADMIN',
  DROP INDEX `InstitutionUser_phone_key`,
  ADD UNIQUE KEY `InsitutionUser_phone_key` (`phone`),
  DROP INDEX `InstitutionUser_institutionId_fkey`,
  ADD KEY `InsitutionUser_insitutionId_fkey` (`insitutionId`),
  ADD CONSTRAINT `InsitutionUser_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Course`
  DROP INDEX `Course_institutionId_fkey`,
  ADD KEY `Course_insitutionId_fkey` (`insitutionId`),
  ADD CONSTRAINT `Course_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Salesman`
  DROP INDEX `Salesman_institutionId_fkey`,
  ADD KEY `Salesman_insitutionId_fkey` (`insitutionId`),
  ADD CONSTRAINT `Salesman_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Order`
  DROP INDEX `Order_institutionId_fkey`,
  ADD KEY `Order_insitutionId_fkey` (`insitutionId`),
  ADD CONSTRAINT `Order_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `SettlementRecord`
  DROP INDEX `SettlementRecord_institutionId_period_key`,
  ADD UNIQUE KEY `SettlementRecord_insitutionId_period_key` (`insitutionId`, `period`),
  ADD CONSTRAINT `SettlementRecord_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Question`
  DROP INDEX `Question_institutionId_fkey`,
  ADD KEY `Question_insitutionId_fkey` (`insitutionId`),
  ADD CONSTRAINT `Question_insitutionId_fkey` FOREIGN KEY (`insitutionId`) REFERENCES `Insitution` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RefreshToken`
  DROP INDEX `RefreshToken_institutionUserId_fkey`,
  ADD KEY `RefreshToken_insitutionUserId_fkey` (`insitutionUserId`),
  ADD CONSTRAINT `RefreshToken_insitutionUserId_fkey` FOREIGN KEY (`insitutionUserId`) REFERENCES `InsitutionUser` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;