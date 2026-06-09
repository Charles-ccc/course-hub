import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type {
  ContractType,
  Institution,
  Salesman,
  SalesmanStatus,
} from "../types/domain";
import {
  centsToYuan,
  contractTypeLabel,
  salesmanStatusLabel,
} from "../utils/format";

interface SalesmanForm {
  institutionId: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  contractType: ContractType;
}

const tabItems: TabsProps["items"] = [
  { key: "ALL", label: "全部业务员" },
  { key: "ACTIVE", label: "正常" },
  { key: "DISABLED", label: "已禁用" },
];

export const SalesmenPage = (): ReactElement => {
  const [tab, setTab] = useState<SalesmanStatus | "ALL">("ALL");
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<SalesmanForm>();
  const queryClient = useQueryClient();

  const salesmenQuery = useQuery({
    queryKey: ["admin-salesmen", tab],
    queryFn: () => adminApi.getSalesmen(tab),
  });
  const institutionsQuery = useQuery({
    queryKey: ["admin-institutions", "active-options"],
    queryFn: () => adminApi.getInstitutions("ACTIVE"),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createSalesman,
    onSuccess: async () => {
      message.success("业务员已创建");
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["admin-salesmen"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: adminApi.disableSalesman,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-salesmen"] });
    },
  });

  const columns: ColumnsType<Salesman> = [
    { title: "姓名", dataIndex: "name" },
    { title: "手机号", dataIndex: "phone" },
    {
      title: "签约类型",
      dataIndex: "contractType",
      render: (value: ContractType) => contractTypeLabel[value],
    },
    { title: "服务学员数", dataIndex: "studentCount" },
    {
      title: "累计佣金（元）",
      dataIndex: "cumulativeCommissionCents",
      render: (value: number) => centsToYuan(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: SalesmanStatus) => (
        <Tag>{salesmanStatusLabel[value]}</Tag>
      ),
    },
    {
      title: "操作",
      render: (_, record) =>
        record.status === "ACTIVE" ? (
          <Button
            type='link'
            danger
            onClick={() =>
              Modal.confirm({
                title: "禁用业务员",
                content: `确认禁用 ${record.name} 吗？`,
                onOk: async () => {
                  await disableMutation.mutateAsync(record.id);
                  message.success("业务员已禁用");
                },
              })
            }
          >
            禁用
          </Button>
        ) : null,
    },
  ];

  return (
    <div className='page-stack'>
      <Card
        title='业务员管理'
        extra={
          <Button type='primary' onClick={() => setOpen(true)}>
            新建业务员
          </Button>
        }
      >
        <Tabs
          activeKey={tab}
          items={tabItems}
          onChange={(value) => setTab(value as SalesmanStatus | "ALL")}
        />
        <Table<Salesman>
          rowKey='id'
          dataSource={salesmenQuery.data ?? []}
          columns={columns}
          loading={salesmenQuery.isLoading}
        />
      </Card>

      <Modal
        title='新建业务员'
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name='institutionId'
            label='所属机构'
            rules={[{ required: true, message: "请选择机构" }]}
          >
            <Select
              options={(institutionsQuery.data ?? []).map(
                (item: Institution) => ({
                  label: item.name,
                  value: item.id,
                }),
              )}
              placeholder='请选择机构'
            />
          </Form.Item>
          <Form.Item
            name='name'
            label='姓名'
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder='请输入姓名' />
          </Form.Item>
          <Form.Item
            name='username'
            label='登录用户名'
            rules={[{ required: true, message: "请输入登录用户名" }]}
          >
            <Input placeholder='请输入登录用户名' />
          </Form.Item>
          <Form.Item
            name='password'
            label='初始密码'
            rules={[{ required: true, message: "请输入初始密码" }]}
          >
            <Input.Password placeholder='请输入初始密码' />
          </Form.Item>
          <Form.Item
            name='phone'
            label='手机号'
            rules={[{ required: true, message: "请输入手机号" }]}
          >
            <Input placeholder='请输入手机号' />
          </Form.Item>
          <Form.Item
            name='contractType'
            label='签约类型'
            rules={[{ required: true, message: "请选择签约类型" }]}
          >
            <Select
              options={[
                { label: "员工制", value: "EMPLOYEE" },
                { label: "代理制", value: "AGENT" },
              ]}
              placeholder='请选择签约类型'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
