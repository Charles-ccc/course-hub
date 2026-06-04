import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Select,
  Space,
  Modal,
  Input,
  message,
  Typography,
} from "antd";
import { orgApi } from "../../services/api";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  COOLING_OFF: "blue",
  COMPLETED: "default",
  REFUNDED: "red",
  OVERDUE: "red",
};
const { Title, Text } = Typography;

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>();

  const load = () => {
    setLoading(true);
    orgApi
      .getOrders({ status: statusFilter })
      .then((r: any) => setOrders(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const columns = [
    {
      title: "学员",
      dataIndex: ["student", "realname"],
      key: "student",
      render: (v: string) => v?.replace(/(?<=.).(?=.)/, "*"),
    },
    { title: "手机", dataIndex: ["student", "phone"], key: "phone" },
    { title: "课程", dataIndex: ["course", "title"], key: "course" },
    {
      title: "总金额",
      dataIndex: "totalAmount",
      key: "amount",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    { title: "期数", dataIndex: "periodCount", key: "period" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] || "default"}>{s}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          {record.installmentItems?.some(
            (i: any) => i.status === "OVERDUE",
          ) && (
            <Button
              size='small'
              danger
              onClick={() => handleOverdue(record.id)}
            >
              处理逾期
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleOverdue = (orderId: string) => {
    Modal.confirm({
      title: "逾期处理",
      content: (
        <div>
          <p>请选择处理方式：</p>
          <Select
            style={{ width: "100%" }}
            options={[{ label: "核销（坏账处理）", value: "write_off" }]}
          />
        </div>
      ),
      onOk: () => {
        message.success("已提交处理");
      },
    });
  };

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Orders</Text>
          <Title level={2} className='page-title'>
            订单管理
          </Title>
          <Text className='page-subtitle'>
            按状态筛选订单与逾期风险，减少从课程到履约的状态切换成本。
          </Text>
        </div>
      </div>
      <Card
        title='订单列表'
        className='table-card'
        extra={
          <Select
            placeholder='筛选状态'
            allowClear
            style={{ width: 160 }}
            onChange={setStatusFilter}
            options={[
              { label: "学习中", value: "ACTIVE" },
              { label: "冷静期", value: "COOLING_OFF" },
              { label: "已完成", value: "COMPLETED" },
              { label: "已退课", value: "REFUNDED" },
            ]}
          />
        }
      >
        <Table
          dataSource={orders}
          columns={columns}
          rowKey='id'
          loading={loading}
        />
      </Card>
    </div>
  );
}
