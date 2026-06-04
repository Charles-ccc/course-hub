import { useState, useEffect } from "react";
import { Card, Row, Col, Table, DatePicker, Button, Typography } from "antd";
import dayjs from "dayjs";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

export default function ReportPage() {
  const [period, setPeriod] = useState(dayjs().format("YYYY-MM"));
  const [gmvData, setGmvData] = useState<any>(null);
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.getGmv(period), adminApi.getHealthMetrics()])
      .then(([gmv, health]: any) => {
        setGmvData(gmv);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [period]);

  const orgColumns = [
    { title: "机构名称", dataIndex: "orgName", key: "orgName" },
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
    { title: "状态", dataIndex: "status", key: "status" },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Reports</Text>
          <Title level={2} className='page-title'>
            数据报表
          </Title>
          <Text className='page-subtitle'>
            按月查看 GMV、平台服务费收入和机构分布，用于运营复盘与结算跟踪。
          </Text>
        </div>
      </div>

      <Card
        className='section-card'
        style={{ marginBottom: 24 }}
        title='GMV 报表'
        extra={
          <DatePicker.MonthPicker
            value={dayjs(period, "YYYY-MM")}
            onChange={(v) => v && setPeriod(v.format("YYYY-MM"))}
            style={{ marginRight: 8 }}
          />
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size='small' className='metric-card'>
              <Text className='metric-label'>总 GMV</Text>
              <Text className='metric-value metric-value--accent'>
                ¥{((gmvData?.totalGmv || 0) / 100).toFixed(0)}
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size='small' className='metric-card'>
              <Text className='metric-label'>平台服务费收入</Text>
              <Text className='metric-value'>
                ¥{((gmvData?.totalFee || 0) / 100).toFixed(0)}
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size='small' className='metric-card'>
              <Text className='metric-label'>机构数</Text>
              <Text className='metric-value'>
                {(gmvData?.orgs || []).length}
              </Text>
            </Card>
          </Col>
        </Row>
        <Table
          dataSource={gmvData?.orgs || []}
          columns={orgColumns}
          rowKey='id'
          loading={loading}
          size='small'
        />
      </Card>
    </div>
  );
}
