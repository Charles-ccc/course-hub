import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { GmvReportItem } from "../types/domain";
import { centsToYuan } from "../utils/format";

export const ReportsPage = (): ReactElement => {
  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    queryFn: adminApi.getReports,
  });

  const columns: ColumnsType<GmvReportItem> = [
    { title: "机构名称", dataIndex: "insitutionName" },
    {
      title: "GMV（元）",
      dataIndex: "gmvCents",
      render: (value: number) => centsToYuan(value),
    },
    {
      title: "服务费（元）",
      dataIndex: "serviceFeeCents",
      render: (value: number) => centsToYuan(value),
    },
  ];

  return (
    <div className='page-stack'>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        数据报表
      </Typography.Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title='本月总 GMV（元）'
              value={Number(
                centsToYuan(reportsQuery.data?.gmv.totalGmvCents ?? 0),
              )}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='本月服务费（元）'
              value={Number(
                centsToYuan(reportsQuery.data?.gmv.totalServiceFeeCents ?? 0),
              )}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='当前逾期率（%）'
              value={reportsQuery.data?.overdue.overdueRate ?? 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
      <Card title={`机构 GMV 排名 ${reportsQuery.data?.gmv.month ?? ""}`}>
        <Table<GmvReportItem>
          rowKey='insitutionId'
          dataSource={reportsQuery.data?.gmv.items ?? []}
          columns={columns}
          loading={reportsQuery.isLoading}
          pagination={false}
        />
      </Card>
    </div>
  );
};
