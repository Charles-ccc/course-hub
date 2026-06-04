import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Typography } from "antd";
import { orgApi } from "../../services/api";

const { Title, Text } = Typography;

const ORDER_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  COOLING_OFF: "blue",
  COMPLETED: "default",
  REFUNDED: "red",
  CREATED: "orange",
};
const ORDER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "学习中",
  COOLING_OFF: "冷静期",
  COMPLETED: "已完成",
  REFUNDED: "已退课",
  CREATED: "待签约",
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orgApi
      .getOrders({ size: 10 })
      .then((r: any) => setOrders(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeCount = orders.filter((o) => o.status === "ACTIVE").length;
  const gmv = orders.reduce((s: number, o: any) => s + o.totalAmount, 0);

  const columns = [
    { title: "学员", dataIndex: ["student", "realname"], key: "student" },
    { title: "课程", dataIndex: ["course", "title"], key: "course" },
    {
      title: "金额",
      dataIndex: "totalAmount",
      key: "amount",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={ORDER_STATUS_COLOR[s]}>{ORDER_STATUS_LABEL[s]}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Overview</Text>
          <Title level={2} className='page-title'>
            机构概览
          </Title>
          <Text className='page-subtitle'>
            汇总订单、学习中学员与 GMV，快速掌握机构当前经营状态。
          </Text>
        </div>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className='metric-card'>
            <Statistic title='本月订单' value={orders.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className='metric-card'>
            <Statistic
              title='学习中学员'
              value={activeCount}
              valueStyle={{ color: "#10B981" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className='metric-card'>
            <Statistic
              title='GMV（元）'
              value={(gmv / 100).toFixed(0)}
              prefix='¥'
              valueStyle={{ color: "#2563EB" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className='metric-card'>
            <Statistic title='逾期率' value='--' suffix='%' />
          </Card>
        </Col>
      </Row>
      <Card title='最近订单' className='table-card'>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey='id'
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
