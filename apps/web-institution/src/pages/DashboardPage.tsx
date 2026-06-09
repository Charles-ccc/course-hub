import { Card, Col, Row, Skeleton, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { institutionApi } from "../services/institutionApi";
import {
  centsToYuan,
  formatDateTime,
  maskName,
  orderStatusLabel,
} from "../utils/format";
import type { Order } from "../types/domain";

export const DashboardPage = (): ReactElement => {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => institutionApi.getOrders(),
  });
  const profileQuery = useQuery({
    queryKey: ["institution-profile"],
    queryFn: institutionApi.getProfile,
  });

  const metrics = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return {
      monthOrderCount: orders.length,
      activeStudentCount: orders.filter((order) => order.status === "ACTIVE")
        .length,
      cumulativeGmvCents: orders.reduce(
        (sum, order) => sum + order.totalAmountCents,
        0,
      ),
    };
  }, [ordersQuery.data]);

  const recentOrders = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return [...orders]
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .slice(0, 10);
  }, [ordersQuery.data]);

  const columns: ColumnsType<Order> = [
    {
      title: "学员",
      dataIndex: "studentName",
      render: (v: string) => maskName(v),
    },
    { title: "课程名称", dataIndex: "courseName" },
    {
      title: "金额（元）",
      dataIndex: "totalAmountCents",
      render: (value: number) => centsToYuan(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: Order["status"]) => orderStatusLabel[status],
    },
    {
      title: "下单时间",
      dataIndex: "createdAt",
      render: (value: string) => formatDateTime(value),
    },
  ];

  if (ordersQuery.isLoading || profileQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className='page-stack'>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        运营概览
      </Typography.Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card title='本月订单数'>{metrics.monthOrderCount}</Card>
        </Col>
        <Col span={6}>
          <Card title='学习中学员数'>{metrics.activeStudentCount}</Card>
        </Col>
        <Col span={6}>
          <Card title='累计 GMV（元）'>
            {centsToYuan(metrics.cumulativeGmvCents)}
          </Card>
        </Col>
        <Col span={6}>
          <Card title='逾期率'>--</Card>
        </Col>
      </Row>

      <Card title='最近订单预览' extra={profileQuery.data?.orgName}>
        <Table<Order>
          rowKey='id'
          dataSource={recentOrders}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
};
