-- Ensure institution org-1001 exists (INSERT IGNORE = skip if already there)
INSERT IGNORE INTO `Insitution`
  (`id`, `name`, `socialCreditCode`, `settlementRate`,
   `depositBalanceCents`, `cumulativeGmvCents`, `cumulativeServiceFeeCents`,
   `status`, `createdAt`, `updatedAt`)
VALUES
  ('org-1001', '欢乐学杭州校区', '91330106784512001X', 8.50,
   5000000, 24500000, 2082500,
   'ACTIVE', NOW(3), NOW(3));

-- Ensure salesman sales-1 exists
INSERT IGNORE INTO `Salesman`
  (`id`, `insitutionId`, `username`, `passwordHash`, `name`, `phone`,
   `contractType`, `groupName`, `status`,
   `studentCount`, `cumulativeCommissionCents`, `createdAt`, `updatedAt`)
VALUES
  ('sales-1', 'org-1001', 'sales01',
   '$2b$10$0wYdD0zW1pA9JoTy4t.xDuoJy4RQdtBP5MFE.ApZXSQ1EoXZDShVK',
   '陈晓东', '13800138001',
   'EMPLOYEE', '华东增长组', 'ACTIVE',
   0, 0, NOW(3), NOW(3));

-- Upsert CHENXD2026 — activate + bind salesman
INSERT INTO `OrgCode`
  (`id`, `insitutionId`, `salesmanId`, `code`, `status`, `usedCount`, `createdAt`, `updatedAt`)
VALUES
  ('orgcode-1', 'org-1001', 'sales-1', 'CHENXD2026', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE', `salesmanId` = 'sales-1', `updatedAt` = NOW(3);

-- Upsert HUADONG888 — activate + bind salesman
INSERT INTO `OrgCode`
  (`id`, `insitutionId`, `salesmanId`, `code`, `status`, `usedCount`, `createdAt`, `updatedAt`)
VALUES
  ('orgcode-2', 'org-1001', 'sales-1', 'HUADONG888', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE', `salesmanId` = 'sales-1', `updatedAt` = NOW(3);
