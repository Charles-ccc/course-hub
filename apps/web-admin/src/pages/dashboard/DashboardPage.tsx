import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Alert, Typography } from "antd";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [overdueRate, setOverdueRate] = useState<any>(null);

  useEffect(() => {
    adminApi.getHealthMetrics().then(setMetrics).catch(console.error);
    adminApi.getOverdueRate().then(setOverdueRate).catch(console.error);
  }, []);

  const isHealthy = (status: string) => status === "healthy";

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Platform metrics</Text>
          <Title level={2} className='page-title'>
            运营健康指标
          </Title>
          <Text className='page-subtitle'>
            聚合回收率、逾期率与退课率，快速判断平台运行健康度。
          </Text>
        </div>
      </div>
      {metrics && (
        <>
          {(metrics.healthStatus?.repaymentRate === "warning" ||
            metrics.healthStatus?.overdueRate === "warning") && (
            <Alert
              type='warning'
              message='存在健康指标异常，请及时排查'
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Row gutter={16}>
            <Col span={8}>
              <Card className='metric-card'>
                <Statistic
                  title='分期回收率（目标>90%）'
                  value={metrics.repaymentRate}
                  valueStyle={{
                    color: isHealthy(metrics.healthStatus.repaymentRate)
                      ? "#10B981"
                      : "#EF4444",
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className='metric-card'>
                <Statistic
                  title='逾期率（目标<10%）'
                  value={metrics.overdueRate}
                  valueStyle={{
                    color: isHealthy(metrics.healthStatus.overdueRate)
                      ? "#10B981"
                      : "#EF4444",
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className='metric-card'>
                <Statistic
                  title='退课率（目标<5%）'
                  value={metrics.refundRate}
                  valueStyle={{
                    color: isHealthy(metrics.healthStatus.refundRate)
                      ? "#10B981"
                      : "#EF4444",
                  }}
                />
              </Card>
            </Col>
          </Row>
          {overdueRate && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card className='metric-card'>
                  <Statistic
                    title='实时逾期率'
                    value={overdueRate.overdueRate ?? overdueRate}
                    valueStyle={{ color: "#EF4444" }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card className='metric-card'>
                  <Statistic
                    title='逾期订单数'
                    value={overdueRate.overdueCount ?? "-"}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card className='metric-card'>
                  <Statistic
                    title='总订单数'
                    value={overdueRate.totalCount ?? "-"}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
}
