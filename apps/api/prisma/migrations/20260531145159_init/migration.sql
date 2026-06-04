-- CreateTable
CREATE TABLE `org` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `unifiedCreditCode` VARCHAR(191) NOT NULL,
    `businessLicenseUrl` VARCHAR(191) NOT NULL,
    `eduQualificationUrl` VARCHAR(191) NOT NULL,
    `alipayMerchantId` VARCHAR(191) NULL,
    `settlementFeeRate` DECIMAL(5, 4) NOT NULL,
    `depositBalance` INTEGER NOT NULL DEFAULT 0,
    `exitNoticeDays` INTEGER NOT NULL DEFAULT 90,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'EXITED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `org_unifiedCreditCode_key`(`unifiedCreditCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NULL,
    `groupId` VARCHAR(191) NULL,
    `contractType` ENUM('EMPLOYEE', 'AGENT') NOT NULL,
    `commissionConfigId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `id` VARCHAR(191) NOT NULL,
    `openidWeixin` VARCHAR(191) NULL,
    `openidAlipay` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `realname` VARCHAR(191) NOT NULL,
    `idNoHash` VARCHAR(191) NOT NULL,
    `idNoEncrypted` VARCHAR(191) NOT NULL,
    `realnameVerified` BOOLEAN NOT NULL DEFAULT false,
    `ageVerifiedAdult` BOOLEAN NOT NULL DEFAULT false,
    `referrerStaffId` VARCHAR(191) NULL,
    `referrerStudentId` VARCHAR(191) NULL,
    `zhimaAuthStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_openidWeixin_key`(`openidWeixin`),
    UNIQUE INDEX `student_openidAlipay_key`(`openidAlipay`),
    UNIQUE INDEX `student_phone_key`(`phone`),
    UNIQUE INDEX `student_idNoHash_key`(`idNoHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `outline` TEXT NOT NULL,
    `teacherInfo` TEXT NOT NULL,
    `videoAssetIds` JSON NOT NULL,
    `price` INTEGER NOT NULL,
    `installmentPlanId` VARCHAR(191) NULL,
    `periodCount` INTEGER NOT NULL,
    `reviewPeriodDays` INTEGER NOT NULL DEFAULT 180,
    `status` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'ONLINE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `sellerOrgId` VARCHAR(191) NOT NULL,
    `attributionStaffId` VARCHAR(191) NULL,
    `totalAmount` INTEGER NOT NULL,
    `periodCount` INTEGER NOT NULL,
    `periodAmount` INTEGER NOT NULL,
    `status` ENUM('CREATED', 'COOLING_OFF', 'ACTIVE', 'COMPLETED', 'REFUNDED', 'TERMINATED') NOT NULL DEFAULT 'CREATED',
    `contractId` VARCHAR(191) NULL,
    `coolingOffDeadline` DATETIME(3) NULL,
    `invoiceSubject` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `installment_item` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `periodNo` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `planAmount` INTEGER NOT NULL,
    `incentiveApplied` INTEGER NOT NULL DEFAULT 0,
    `actualAmount` INTEGER NOT NULL,
    `deductedAmount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'DELIVERED', 'PAID', 'OVERDUE', 'WRITTEN_OFF') NOT NULL DEFAULT 'PENDING',
    `contentDeliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `installment_item_orderId_periodNo_key`(`orderId`, `periodNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `partyAOrgId` VARCHAR(191) NOT NULL,
    `partyBStudentId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `esignProvider` VARCHAR(191) NOT NULL,
    `esignRef` VARCHAR(191) NULL,
    `signedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `contract_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_auth` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `channels` JSON NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deduction` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `periodNo` INTEGER NOT NULL,
    `installmentItemId` VARCHAR(191) NULL,
    `payeeOrgId` VARCHAR(191) NOT NULL,
    `channel` ENUM('WECHAT_SCORE', 'ZHIMA', 'BANKCARD') NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `attempts` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_authorization` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `authToken` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_decision` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `authId` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eligible` BOOLEAN NOT NULL,
    `riskTier` VARCHAR(191) NULL,
    `suggestedLimit` INTEGER NULL,
    `providerRef` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_agreement` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `agreementNo` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `signedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `type` ENUM('CLOSING', 'PERFORMANCE') NOT NULL,
    `periodNo` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SETTLED', 'HELD', 'CLAWED_BACK') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referral_reward` (
    `id` VARCHAR(191) NOT NULL,
    `inviterStudentId` VARCHAR(191) NOT NULL,
    `inviteeStudentId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `grossAmount` INTEGER NOT NULL,
    `taxWithheld` INTEGER NOT NULL DEFAULT 0,
    `netAmount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
    `trigger` VARCHAR(191) NOT NULL DEFAULT 'invitee_first_repayment',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_checkin` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `coursePeriod` INTEGER NOT NULL,
    `faceMatchRef` VARCHAR(191) NULL,
    `matched` BOOLEAN NOT NULL DEFAULT false,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incentive` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `sourceOrgId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `appliedToPeriod` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'granted',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_record` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `type` ENUM('QA', 'TEACHER_OUTREACH', 'CONTENT_UNLOCK', 'CHECKIN') NOT NULL,
    `payloadRef` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settlement` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `gmv` INTEGER NOT NULL,
    `platformServiceFee` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SETTLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposit_ledger` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT_IN', 'RISK_DEDUCTION', 'REFUND') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_referrerStaffId_fkey` FOREIGN KEY (`referrerStaffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_referrerStudentId_fkey` FOREIGN KEY (`referrerStudentId`) REFERENCES `student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course` ADD CONSTRAINT `course_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_sellerOrgId_fkey` FOREIGN KEY (`sellerOrgId`) REFERENCES `org`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_attributionStaffId_fkey` FOREIGN KEY (`attributionStaffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installment_item` ADD CONSTRAINT `installment_item_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract` ADD CONSTRAINT `contract_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_auth` ADD CONSTRAINT `payment_auth_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deduction` ADD CONSTRAINT `deduction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deduction` ADD CONSTRAINT `deduction_installmentItemId_fkey` FOREIGN KEY (`installmentItemId`) REFERENCES `installment_item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_authorization` ADD CONSTRAINT `credit_authorization_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_decision` ADD CONSTRAINT `credit_decision_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_agreement` ADD CONSTRAINT `credit_agreement_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission` ADD CONSTRAINT `commission_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission` ADD CONSTRAINT `commission_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_reward` ADD CONSTRAINT `referral_reward_inviterStudentId_fkey` FOREIGN KEY (`inviterStudentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_reward` ADD CONSTRAINT `referral_reward_inviteeStudentId_fkey` FOREIGN KEY (`inviteeStudentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_reward` ADD CONSTRAINT `referral_reward_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_checkin` ADD CONSTRAINT `learning_checkin_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_record` ADD CONSTRAINT `service_record_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settlement` ADD CONSTRAINT `settlement_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deposit_ledger` ADD CONSTRAINT `deposit_ledger_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
