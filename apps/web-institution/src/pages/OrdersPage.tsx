import { Badge, Card, Table, Tabs, Tag } from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { institutionApi } from "../services/institutionApi";
import type { Installment, Order, OrderStatus } from "../types/domain";
import {
  centsToYuan,
  formatDate,
  formatDateTime,
  maskName,
  orderStatusLabel,
  periodStatusLabel,
} from "../utils/format";

const tabItems: TabsProps["items"] = [
  { key: "ALL", label: "全部" },
  { key: "CREATED", label: "待签约" },
  { key: "COOLING_OFF", label: "冷静期中" },
  { key: "ACTIVE", label: "学习中" },
  { key: "COMPLETED", label: "已完成" },
  { key: "REFUNDED", label: "已退款" },
  { key: "TERMINATED", label: "已终止" },
];

export const OrdersPage = (): ReactElement => {
  const [statusTab, setStatusTab] = useState<string>("ALL");

  const ordersQuery = useQuery({
    queryKey: ["orders", statusTab],
    queryFn: () =>
      institutionApi.getOrders(
        statusTab === "ALL" ? undefined : (statusTab as OrderStatus),
      ),
  });

  const orderColumns: ColumnsType<Order> = [
    { title: "订单号", dataIndex: "id" },
    {
      title: "学员",
      dataIndex: "studentName",
      render: (v: string) => maskName(v),
    },
    { title: "课程名称", dataIndex: "courseName" },
    {
      title: "订单金额（元）",
      dataIndex: "totalAmountCents",
      render: (v: number) => centsToYuan(v),
    },
    { title: "分期期数", dataIndex: "periodCount" },
    {
      title: "每期金额（元）",
      render: (_, record) =>
        centsToYuan(Math.floor(record.totalAmountCents / record.periodCount)),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: OrderStatus) => {
        if (status === "COOLING_OFF") {
          return <Badge status='processing' text={orderStatusLabel[status]} />;
        }
        return <Tag>{orderStatusLabel[status]}</Tag>;
      },
    },
    {
      title: "冷静期截止",
      dataIndex: "coolingOffEndAt",
      render: (v?: string) => formatDateTime(v),
    },
    {
      title: "下单时间",
      dataIndex: "createdAt",
      render: (v: string) => formatDateTime(v),
    },
  ];

  const installmentColumns: ColumnsType<Installment> = useMemo(
    () => [
      { title: "期次", render: (_, item) => `第 ${item.periodNo} 期` },
      {
        title: "到期日",
        dataIndex: "dueDate",
        render: (v: string) => formatDate(v),
      },
      {
        title: "计划金额（元）",
        dataIndex: "plannedAmountCents",
        render: (v: number) => centsToYuan(v),
      },
      {
        title: "已扣金额（元）",
        dataIndex: "paidAmountCents",
        render: (v: number) => centsToYuan(v),
      },
      {
        title: "内容交付时间",
        dataIndex: "contentDeliveredAt",
        render: (v?: string) => formatDateTime(v),
      },
      {
        title: "期次状态",
        dataIndex: "status",
        render: (status: Installment["status"]) => {
          if (status === "OVERDUE")
            return <Tag color='red'>{periodStatusLabel[status]}</Tag>;
          if (status === "WRITTEN_OFF")
            return <Tag>{periodStatusLabel[status]}</Tag>;
          return periodStatusLabel[status];
        },
      },
    ],
    [],
  );

  return (
    <Card title='订单管理'>
      <Tabs activeKey={statusTab} items={tabItems} onChange={setStatusTab} />
      <Table<Order>
        rowKey='id'
        dataSource={ordersQuery.data ?? []}
        columns={orderColumns}
        loading={ordersQuery.isLoading}
        expandable={{
          expandedRowRender: (order) => (
            <Table<Installment>
              rowKey='id'
              columns={installmentColumns}
              dataSource={order.installments}
              pagination={false}
            />
          ),
          rowExpandable: (order) => order.installments.length > 0,
        }}
      />
    </Card>
  );
};
