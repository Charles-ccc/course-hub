import { Card, Col, Row, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { insitutionApi } from "../services/insitutionApi";
import type { SettlementRecord } from "../types/domain";
import { centsToYuan, settlementStatusLabel } from "../utils/format";

export const SettlementsPage = (): ReactElement => {
  const profileQuery = useQuery({
    queryKey: ["insitution-profile"],
    queryFn: insitutionApi.getProfile,
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements"],
    queryFn: insitutionApi.getSettlements,
  });

  const columns: ColumnsType<SettlementRecord> = [
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
  ];

  return (
    <div className='page-stack'>
      <Row gutter={16}>
        <Col span={8}>
          <Card title='履约保证金余额（元）'>
            {centsToYuan(profileQuery.data?.depositBalanceCents ?? 0)}
          </Card>
        </Col>
        <Col span={8}>
          <Card title='结算费率（%）'>
            {profileQuery.data?.settlementRate ?? "--"}
          </Card>
        </Col>
      </Row>
      <Card title='结算对账' extra='机构本月实得 = 本月 GMV × (1 - 结算费率%)'>
        <Table<SettlementRecord>
          rowKey='id'
          dataSource={settlementsQuery.data ?? []}
          columns={columns}
          loading={settlementsQuery.isLoading || profileQuery.isLoading}
        />
      </Card>
    </div>
  );
};
