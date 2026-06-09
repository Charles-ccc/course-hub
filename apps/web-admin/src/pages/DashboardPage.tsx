import { Alert, Card, Col, Row, Skeleton, Statistic, Typography } from "antd";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { centsToYuan } from "../utils/format";

export const DashboardPage = (): ReactElement => {
  const healthQuery = useQuery({
    queryKey: ["admin-health"],
    queryFn: adminApi.getHealthMetrics,
  });

  if (healthQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const metrics = healthQuery.data;

  return (
    <div className='page-stack'>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        运营概览
      </Typography.Title>
      <Alert
        type={metrics?.status === "WARNING" ? "warning" : "success"}
        message={
          metrics?.status === "WARNING"
            ? "平台存在预警指标，请及时处理"
            : "平台运行健康"
        }
      />
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title='平台总 GMV（元）'
              value={Number(centsToYuan(metrics?.totalGmvCents ?? 0))}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='活跃订单数'
              value={metrics?.activeOrderCount ?? 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title='还款率（%）'
              value={metrics?.repaymentRate ?? 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title='逾期率（%）'
              value={metrics?.overdueRate ?? 0}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title='退款率（%）'
              value={metrics?.refundRate ?? 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
