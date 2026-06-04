import { useState, useEffect } from "react";
import { Table, Card, Button, Tag, message, Typography } from "antd";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = { PENDING: "orange", SETTLED: "green" };
const STATUS_LABEL: Record<string, string> = { PENDING: "待结算", SETTLED: "已结算" };

export default function SettlementPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .getSettlement()
      .then((r: any) => setSettlements(r.items || r))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSettle = async (id: string) => {
    setSettling(id);
    try {
      await adminApi.doSettle(id);
      message.success("结算执行成功");
      load();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSettling(null);
    }
  };

  const columns = [
    { title: "机构", dataIndex: ["org", "name"], key: "org", render: (_: any, r: any) => r.org?.name || r.orgId },
    { title: "结算周期", dataIndex: "period", key: "period" },
    {
      title: "GMV（元）",
      dataIndex: "gmv",
      key: "gmv",
      render: (v: number) => `¥${(v / 100).toLocaleString()}`,
    },
    {
      title: "平台服务费（元）",
      dataIndex: "platformServiceFee",
      key: "fee",
      render: (v: number) => `¥${(v / 100).toLocaleString()}`,
    },
    {
      title: "应付机构（元）",
      key: "payout",
      render: (_: any, r: any) => `¥${((r.gmv - r.platformServiceFee) / 100).toLocaleString()}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, r: any) =>
        r.status === "PENDING" ? (
          <Button
            size="small"
            type="primary"
            loading={settling === r.id}
            onClick={() => handleSettle(r.id)}
          >
            执行结算
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-intro">
          <Text className="page-kicker">Finance</Text>
          <Title level={2} className="page-title">结算管理</Title>
          <Text className="page-subtitle">
            按月查看各机构 GMV 及平台服务费，执行资金划拨结算。
          </Text>
        </div>
      </div>
      <Card title="月度结算列表" className="table-card">
        <Table dataSource={settlements} columns={columns} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
}
