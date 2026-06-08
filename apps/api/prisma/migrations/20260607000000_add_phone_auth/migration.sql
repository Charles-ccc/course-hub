-- 1. 先把列改为可空，再将空字符串更新为 NULL

ALTER TABLE `student`
  MODIFY COLUMN `phone`         VARCHAR(191) NULL,
  MODIFY COLUMN `realname`      VARCHAR(191) NULL,
  MODIFY COLUMN `idNoHash`      VARCHAR(191) NULL,
  MODIFY COLUMN `idNoEncrypted` VARCHAR(191) NULL;

-- 2. 将 OAuth 历史记录中的空字符串改为 NULL
UPDATE `student` SET `phone`         = NULL WHERE `phone`         = '';
UPDATE `student` SET `realname`      = NULL WHERE `realname`      = '';
UPDATE `student` SET `idNoHash`      = NULL WHERE `idNoHash`      = '';
UPDATE `student` SET `idNoEncrypted` = NULL WHERE `idNoEncrypted` = '';

-- 3. 添加 passwordHash 列
ALTER TABLE `student`
  ADD COLUMN `passwordHash` VARCHAR(191) NULL AFTER `openidAlipay`;
