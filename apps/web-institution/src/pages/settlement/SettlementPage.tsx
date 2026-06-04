import { useState, useEffect } from "react";
import { Table, Card, Statistic, Row, Col, Tag, Typography } from "antd";
import { orgApi } from "../../services/api";

const { Title, Text } = Typography;

export default function SettlementPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([orgApi.getSettlement(), orgApi.getDeposit()])
      .then(([s, d]: any) => {
        setSettlements(s);
        setDeposit(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalFee = settlements
    .filter((s) => s.status === "SETTLED")
    .reduce((sum: number, s: any) => sum + s.platformServiceFee, 0);

  const columns = [
    { title: "结算周期", dataIndex: "period", key: "period" },
    {
      title: "GMV（元）",
      dataIndex: "gmv",
      key: "gmv",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "平台服务费",
      dataIndex: "platformServiceFee",
      key: "fee",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "SETTLED" ? "green" : "orange"}>
          {s === "SETTLED" ? "已结算" : "待结算"}
        </Tag>
      ),
    },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Settlement</Text>
          <Title level={2} className='page-title'>
            结算对账
          </Title>
          <Text className='page-subtitle'>
            查看保证金余额、平台服务费与周期结算明细，方便财务核对。
          </Text>
        </div>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className='metric-card'>
            <Statistic
              title='履约保证金余额'
              value={(deposit?.balance || 0) / 100}
              prefix='¥'
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className='metric-card'>
            <Statistic
              title='已缴服务费'
              value={totalFee / 100}
              prefix='¥'
              precision={2}
              valueStyle={{ color: "#2563EB" }}
            />
          </Card>
        </Col>
      </Row>
      <Card title='结算明细' className='table-card'>
        <Table
          dataSource={settlements}
          columns={columns}
          rowKey='id'
          loading={loading}
        />
      </Card>
    </div>
  );
}
