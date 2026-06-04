-- AlterTable: 给 staff 表新增 openidWeixin / openidAlipay 字段
ALTER TABLE `staff`
  ADD COLUMN `openidWeixin` VARCHAR(191) NULL,
  ADD COLUMN `openidAlipay` VARCHAR(191) NULL;

-- 唯一索引（允许多个 NULL，MySQL 默认行为）
CREATE UNIQUE INDEX `staff_openidWeixin_key` ON `staff`(`openidWeixin`);
CREATE UNIQUE INDEX `staff_openidAlipay_key` ON `staff`(`openidAlipay`);
