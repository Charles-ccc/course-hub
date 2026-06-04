import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  message,
  Space,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { orgApi } from "../../services/api";
import { useAuthStore } from "../../store/auth";

const { Title, Text } = Typography;

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const orgId = useAuthStore((s) => s.orgId);

  const load = () => {
    if (!orgId) return;
    orgApi
      .getCourses(orgId)
      .then((r: any) => setCourses(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const handleCreate = async (values: any) => {
    try {
      await orgApi.createCourse(values);
      message.success("课程创建成功");
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: "课程名称", dataIndex: "title", key: "title" },
    {
      title: "总价（元）",
      dataIndex: "price",
      key: "price",
      render: (v: number) => `¥${(v / 100).toFixed(0)}`,
    },
    {
      title: "期数",
      dataIndex: "periodCount",
      key: "period",
      render: (v: number) => `${v}期`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "ONLINE" ? "green" : "default"}>
          {s === "ONLINE" ? "已上线" : "已下线"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, r: any) => (
        <Space>
          <Button
            size='small'
            onClick={() =>
              orgApi
                .updateCourse(r.id, {
                  status: r.status === "ONLINE" ? "OFFLINE" : "ONLINE",
                })
                .then(load)
            }
          >
            {r.status === "ONLINE" ? "下线" : "上线"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Courses</Text>
          <Title level={2} className='page-title'>
            课程管理
          </Title>
          <Text className='page-subtitle'>
            维护课程定价、分期期数和上下线状态，保持前台展示与签约信息一致。
          </Text>
        </div>
      </div>
      <Card
        title='课程列表'
        className='table-card'
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            新建课程
          </Button>
        }
      >
        <Table
          dataSource={courses}
          columns={columns}
          rowKey='id'
          loading={loading}
        />
        <Modal
          title='新建课程'
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={form.submit}
          okText='创建'
        >
          <Form form={form} layout='vertical' onFinish={handleCreate}>
            <Form.Item
              name='title'
              label='课程名称'
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name='outline'
              label='课程大纲'
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name='teacherInfo'
              label='师资介绍'
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item
              name='price'
              label='总价（分，1元=100分）'
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
            <Form.Item
              name='periodCount'
              label='分期数'
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={1} max={24} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
