import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Modal,
  Input,
  message,
  Tag,
  Typography,
} from "antd";
import { orgApi } from "../../services/api";

const { Title, Text } = Typography;

export default function OverduePage() {
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    orgApi
      .getOrders({ status: "ACTIVE" })
      .then((r: any) => {
        const items = r.items.flatMap((o: any) =>
          (o.installmentItems || [])
            .filter((i: any) => i.status === "OVERDUE")
            .map((i: any) => ({ ...i, student: o.student, course: o.course })),
        );
        setOverdueItems(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWriteOff = (id: string) => {
    Modal.confirm({
      title: "确认核销",
      content: (
        <div>
          <p>核销后该期将标记为坏账，机构自担损失（不由平台兜底）。</p>
          <Input.TextArea
            placeholder='备注原因'
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      onOk: async () => {
        try {
          await orgApi.overdueAction(id, "write_off", remark);
          message.success("已核销");
          setOverdueItems((prev) => prev.filter((i) => i.id !== id));
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const columns = [
    {
      title: "学员",
      dataIndex: ["student", "realname"],
      key: "student",
      render: (v: string) => v?.replace(/(?<=.).(?=.)/, "*"),
    },
    { title: "课程", dataIndex: ["course", "title"], key: "course" },
    {
      title: "期数",
      dataIndex: "periodNo",
      key: "period",
      render: (v: number) => `第${v}期`,
    },
    {
      title: "金额",
      dataIndex: "actualAmount",
      key: "amount",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "到期日",
      dataIndex: "dueDate",
      key: "due",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    { title: "状态", key: "status", render: () => <Tag color='red'>逾期</Tag> },
    {
      title: "机构催收决策",
      key: "action",
      render: (_: any, record: any) => (
        <Button size='small' danger onClick={() => handleWriteOff(record.id)}>
          核销坏账
        </Button>
      ),
    },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Overdue</Text>
          <Title level={2} className='page-title'>
            逾期管理
          </Title>
          <Text className='page-subtitle'>
            仅保留机构需要做出的处置动作，并在页面中明确合规边界。
          </Text>
        </div>
      </div>
      <Card
        title={`逾期列表（${overdueItems.length} 条）`}
        className='table-card'
      >
        <div className='inline-note'>
          催收决策由机构作出；平台仅提供工具。禁止骚扰、威胁、向无关第三人催收。业务员不代行催收。
        </div>
        <div style={{ height: 16 }} />
        <Table
          dataSource={overdueItems}
          columns={columns}
          rowKey='id'
          loading={loading}
        />
      </Card>
    </div>
  );
}
