-- Ensure institution org-1001 exists (INSERT IGNORE = skip if already there)
INSERT IGNORE INTO `Insitution`
  (`id`, `name`, `socialCreditCode`, `settlementRate`,
   `depositBalanceCents`, `cumulativeGmvCents`, `cumulativeServiceFeeCents`,
   `status`, `createdAt`, `updatedAt`)
VALUES
  ('org-1001', '欢乐学杭州校区', '91330106784512001X', 8.50,
   5000000, 24500000, 2082500,
   'ACTIVE', NOW(3), NOW(3));

-- Upsert CHENXD2026 — activate if exists, insert if not
INSERT INTO `OrgCode`
  (`id`, `insitutionId`, `salesmanId`, `code`, `status`, `usedCount`, `createdAt`, `updatedAt`)
VALUES
  ('orgcode-1', 'org-1001', NULL, 'CHENXD2026', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE', `updatedAt` = NOW(3);

-- Upsert HUADONG888 — activate if exists, insert if not
INSERT INTO `OrgCode`
  (`id`, `insitutionId`, `salesmanId`, `code`, `status`, `usedCount`, `createdAt`, `updatedAt`)
VALUES
  ('orgcode-2', 'org-1001', NULL, 'HUADONG888', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE', `updatedAt` = NOW(3);
