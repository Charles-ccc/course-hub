import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Modal,
  Input,
  InputNumber,
  Tag,
  message,
  Space,
  Typography,
} from "antd";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  PENDING: "orange",
  ACTIVE: "green",
  SUSPENDED: "red",
  EXITED: "default",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  ACTIVE: "已入驻",
  SUSPENDED: "已暂停",
  EXITED: "已退出",
};

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    orgId: string;
  }>({ open: false, orgId: "" });
  const [feeRate, setFeeRate] = useState(0.03);

  const load = () => {
    adminApi
      .getOrgs()
      .then((r: any) => setOrgs(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async () => {
    try {
      await adminApi.approveOrg(approveModal.orgId, feeRate);
      message.success("机构审核通过");
      setApproveModal({ open: false, orgId: "" });
      load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleSuspend = (id: string) => {
    Modal.confirm({
      title: "暂停机构",
      content: <Input.TextArea placeholder='暂停原因' />,
      onOk: () => adminApi.suspendOrg(id, "违规操作").then(load),
    });
  };

  const columns = [
    { title: "机构名称", dataIndex: "name", key: "name" },
    { title: "统一信用代码", dataIndex: "unifiedCreditCode", key: "code" },
    {
      title: "服务费率",
      dataIndex: "settlementFeeRate",
      key: "rate",
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: "保证金（元）",
      dataIndex: "depositBalance",
      key: "deposit",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, r: any) => (
        <Space>
          {r.status === "PENDING" && (
            <Button
              size='small'
              type='primary'
              onClick={() => setApproveModal({ open: true, orgId: r.id })}
            >
              审核通过
            </Button>
          )}
          {r.status === "ACTIVE" && (
            <Button size='small' danger onClick={() => handleSuspend(r.id)}>
              暂停
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className='page-shell'>
        <div className='page-header'>
          <div className='page-intro'>
            <Text className='page-kicker'>Partners</Text>
            <Title level={2} className='page-title'>
              机构管理
            </Title>
            <Text className='page-subtitle'>
              统一审核合作机构的准入状态、费率与履约保证金情况。
            </Text>
          </div>
        </div>
        <Card title='机构列表' className='table-card'>
          <Table
            dataSource={orgs}
            columns={columns}
            rowKey='id'
            loading={loading}
          />
        </Card>
      </div>
      <Modal
        title='设置服务费率并通过审核'
        open={approveModal.open}
        onCancel={() => setApproveModal({ open: false, orgId: "" })}
        onOk={handleApprove}
        okText='确认通过'
      >
        <div style={{ marginBottom: 16 }}>
          <span>服务费率（%）：</span>
          <InputNumber
            min={0}
            max={20}
            precision={2}
            value={feeRate * 100}
            onChange={(v) => setFeeRate((v || 0) / 100)}
          />
        </div>
      </Modal>
    </>
  );
}
