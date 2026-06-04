import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, message, Typography } from "antd";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

type StaffItem = {
  id: string;
  name: string;
  phone: string;
  contractType: "EMPLOYEE" | "AGENT";
  status: "ACTIVE" | "DISABLED";
  studentCount: number;
  commissionTotal: number;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string>();

  const load = () => {
    setLoading(true);
    adminApi
      .getStaffList()
      .then((response: any) => setStaff(response.items || []))
      .catch((error: any) => message.error(error.message || "加载业务员失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDisable = async (id: string) => {
    setActionId(id);
    try {
      const updated: any = await adminApi.disableStaff(id);
      setStaff((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
      message.success("已禁用二维码，归属关系保留");
    } catch (error: any) {
      message.error(error.message || "禁用失败");
    } finally {
      setActionId(undefined);
    }
  };

  const columns = [
    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "手机", dataIndex: "phone", key: "phone" },
    {
      title: "类型",
      dataIndex: "contractType",
      key: "type",
      render: (v: string) => (v === "EMPLOYEE" ? "员工" : "代理"),
    },
    { title: "名下学员", dataIndex: "studentCount", key: "students" },
    {
      title: "累计提成（元）",
      dataIndex: "commissionTotal",
      key: "commission",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "ACTIVE" ? "green" : "default"}>
          {s === "ACTIVE" ? "在职" : "已禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, r: StaffItem) =>
        r.status === "ACTIVE" ? (
          <Button
            size='small'
            danger
            loading={actionId === r.id}
            onClick={() => handleDisable(r.id)}
          >
            禁用
          </Button>
        ) : null,
    },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Staff</Text>
          <Title level={2} className='page-title'>
            业务员管理
          </Title>
          <Text className='page-subtitle'>
            查看业务员合同类型、名下学员与累计提成，统一处理停用状态。
          </Text>
        </div>
      </div>
      <Card title='业务员列表' className='table-card'>
        <Table
          dataSource={staff}
          columns={columns}
          rowKey='id'
          loading={loading}
        />
      </Card>
    </div>
  );
}
