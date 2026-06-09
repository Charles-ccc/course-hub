import { Button, Card, Modal, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { SettlementRecord } from "../types/domain";
import { centsToYuan, settlementStatusLabel } from "../utils/format";

export const SettlementsPage = (): ReactElement => {
  const queryClient = useQueryClient();
  const settlementsQuery = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: adminApi.getSettlements,
  });

  const executeMutation = useMutation({
    mutationFn: adminApi.executeSettlement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-settlements"] });
    },
  });

  const columns: ColumnsType<SettlementRecord> = [
    { title: "机构名称", dataIndex: "institutionName" },
    { title: "结算周期", dataIndex: "period" },
    {
      title: "本期 GMV（元）",
      dataIndex: "gmvCents",
      render: (v: number) => centsToYuan(v),
    },
    {
      title: "平台服务费（元）",
      dataIndex: "serviceFeeCents",
      render: (v: number) => centsToYuan(v),
    },
    {
      title: "机构实得（元）",
      render: (_, row) => centsToYuan(row.gmvCents - row.serviceFeeCents),
    },
    {
      title: "结算状态",
      dataIndex: "status",
      render: (status: SettlementRecord["status"]) =>
        settlementStatusLabel[status],
    },
    {
      title: "操作",
      render: (_, record) =>
        record.status === "PENDING" ? (
          <Button
            type='link'
            onClick={() =>
              Modal.confirm({
                title: "执行结算",
                content: `确认对 ${record.institutionName} ${record.period} 执行结算吗？该操作不可撤销。`,
                onOk: async () => {
                  await executeMutation.mutateAsync(record.id);
                  message.success("结算已执行");
                },
              })
            }
          >
            执行结算
          </Button>
        ) : null,
    },
  ];

  return (
    <div className='page-stack'>
      <Card title='结算管理' extra='机构实得 = GMV - 平台服务费'>
        <Table<SettlementRecord>
          rowKey='id'
          dataSource={settlementsQuery.data ?? []}
          columns={columns}
          loading={settlementsQuery.isLoading}
        />
      </Card>
    </div>
  );
};
