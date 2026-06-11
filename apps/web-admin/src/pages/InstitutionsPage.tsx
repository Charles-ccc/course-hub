import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Table,
  Tabs,
  Tag,
  message,
  Space,
} from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { Institution } from "../types/domain";
import { centsToYuan, institutionStatusLabel } from "../utils/format";

const tabItems: TabsProps["items"] = [
  { key: "ALL", label: "全部机构" },
  { key: "PENDING", label: "待审核" },
  { key: "ACTIVE", label: "运营中" },
  { key: "SUSPENDED", label: "已暂停" },
];

type FormMode = "create" | "edit";

interface FormValues {
  name: string;
  socialCreditCode: string;
  depositBalanceCents: number;
}

export const InstitutionsPage = (): ReactElement => {
  const [tab, setTab] = useState<Institution["status"] | "ALL">("ALL");
  const [approving, setApproving] = useState<Institution | null>(null);
  const [suspending, setSuspending] = useState<Institution | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingInstitution, setEditingInstitution] =
    useState<Institution | null>(null);
  const [deleting, setDeleting] = useState<Institution | null>(null);
  const [approveForm] = Form.useForm<{ settlementRate: number }>();
  const [suspendForm] = Form.useForm<{ reason: string }>();
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const institutionsQuery = useQuery({
    queryKey: ["admin-institutions", tab],
    queryFn: () => adminApi.getInstitutions(tab),
  });

  const actionMutation = useMutation({
    mutationFn: (
      payload:
        | { id: string; type: "approve"; settlementRate: number }
        | { id: string; type: "suspend"; reason: string },
    ) => {
      return adminApi.updateInstitutionStatus(
        payload.id,
        payload.type === "approve"
          ? { type: "approve", settlementRate: payload.settlementRate }
          : { type: "suspend", reason: payload.reason },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      socialCreditCode: string;
      depositBalanceCents?: number;
    }) => adminApi.createInstitution(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
      message.success("机构创建成功");
      setFormMode(null);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      data: {
        name?: string;
        socialCreditCode?: string;
        depositBalanceCents?: number;
      };
    }) => adminApi.updateInstitution(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
      message.success("机构编辑成功");
      setFormMode(null);
      setEditingInstitution(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteInstitution(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-institutions"] });
      message.success("机构已删除");
      setDeleting(null);
    },
  });

  const columns: ColumnsType<Institution> = [
    { title: "机构名称", dataIndex: "name" },
    { title: "统一社会信用代码", dataIndex: "socialCreditCode" },
    {
      title: "保证金余额（元）",
      dataIndex: "depositBalanceCents",
      render: (value: number) => centsToYuan(value),
    },
    { title: "结算费率（%）", dataIndex: "settlementRate" },
    {
      title: "累计 GMV（元）",
      dataIndex: "cumulativeGmvCents",
      render: (value: number) => centsToYuan(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: Institution["status"]) => (
        <Tag>{institutionStatusLabel[value]}</Tag>
      ),
    },
    {
      title: "操作",
      render: (_, record) => (
        <Space>
          {(record.status === "PENDING" || record.status === "ACTIVE") && (
            <Button
              type='link'
              size='small'
              onClick={() => {
                setEditingInstitution(record);
                setFormMode("edit");
                form.setFieldsValue({
                  name: record.name,
                  socialCreditCode: record.socialCreditCode,
                  depositBalanceCents: centsToYuan(
                    record.depositBalanceCents,
                  ) as unknown as number,
                });
              }}
            >
              编辑
            </Button>
          )}
          {record.status === "PENDING" && (
            <Button
              type='link'
              size='small'
              danger
              onClick={() => setDeleting(record)}
            >
              删除
            </Button>
          )}
          {record.status === "PENDING" && (
            <Button
              type='link'
              size='small'
              onClick={() => setApproving(record)}
            >
              审核通过
            </Button>
          )}
          {record.status === "ACTIVE" && (
            <Button
              type='link'
              danger
              size='small'
              onClick={() => setSuspending(record)}
            >
              暂停
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='page-stack'>
      <Card
        title='机构管理'
        extra={
          <Button
            type='primary'
            onClick={() => {
              setFormMode("create");
              form.resetFields();
            }}
          >
            新增机构
          </Button>
        }
      >
        <Tabs
          activeKey={tab}
          items={tabItems}
          onChange={(value) => setTab(value as Institution["status"] | "ALL")}
        />
        <Table<Institution>
          rowKey='id'
          dataSource={institutionsQuery.data ?? []}
          columns={columns}
          loading={institutionsQuery.isLoading}
        />
      </Card>

      <Modal
        title={formMode === "create" ? "新增机构" : "编辑机构"}
        open={formMode !== null}
        onCancel={() => {
          setFormMode(null);
          setEditingInstitution(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={async (values) => {
            if (formMode === "create") {
              await createMutation.mutateAsync({
                name: values.name,
                socialCreditCode: values.socialCreditCode,
                depositBalanceCents: values.depositBalanceCents
                  ? Math.round(values.depositBalanceCents * 100)
                  : 0,
              });
            } else if (formMode === "edit" && editingInstitution) {
              await updateMutation.mutateAsync({
                id: editingInstitution.id,
                data: {
                  name: values.name,
                  socialCreditCode: values.socialCreditCode,
                  depositBalanceCents: values.depositBalanceCents
                    ? Math.round(values.depositBalanceCents * 100)
                    : 0,
                },
              });
            }
          }}
        >
          <Form.Item
            name='name'
            label='机构名称'
            rules={[{ required: true, message: "请输入机构名称" }]}
          >
            <Input placeholder='请输入机构名称' maxLength={100} />
          </Form.Item>
          <Form.Item
            name='socialCreditCode'
            label='统一社会信用代码'
            rules={[
              { required: true, message: "请输入统一社会信用代码" },
              {
                pattern: /^\d{18}$/,
                message: "统一社会信用代码必须为 18 位数字",
              },
            ]}
          >
            <Input placeholder='请输入 18 位统一社会信用代码' maxLength={18} />
          </Form.Item>
          <Form.Item
            name='depositBalanceCents'
            label='保证金（元）'
            tooltip={
              editingInstitution?.status === "ACTIVE" &&
              institutionsQuery.data?.some(
                (i) => i.id === editingInstitution.id,
              )
                ? "已结算的机构保证金不可修改"
                : undefined
            }
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: "100%" }}
              disabled={
                formMode === "edit" && editingInstitution?.status === "ACTIVE"
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title='确认删除'
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onOk={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id);
          }
        }}
        confirmLoading={deleteMutation.isPending}
        okButtonProps={{ danger: true }}
      >
        <p>删除后该机构的所有关联数据（如草稿课程）将被删除，且无法恢复。</p>
        <p>
          确定要删除机构 <strong>{deleting?.name}</strong> 吗？
        </p>
      </Modal>

      <Modal
        title='审核通过机构'
        open={!!approving}
        onCancel={() => setApproving(null)}
        onOk={() => approveForm.submit()}
        confirmLoading={actionMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={approveForm}
          layout='vertical'
          onFinish={async (values) => {
            if (!approving) {
              return;
            }
            await actionMutation.mutateAsync({
              id: approving.id,
              type: "approve",
              settlementRate: values.settlementRate,
            });
            message.success("机构审核已通过");
            setApproving(null);
            approveForm.resetFields();
          }}
        >
          <Form.Item label='机构名称'>
            <Input value={approving?.name} readOnly />
          </Form.Item>
          <Form.Item label='统一社会信用代码'>
            <Input value={approving?.socialCreditCode} readOnly />
          </Form.Item>
          <Form.Item
            name='settlementRate'
            label='结算费率（%）'
            rules={[{ required: true, message: "请输入结算费率" }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <div style={{ color: "#ff7a45", marginTop: "12px" }}>
            费率设定后无法通过界面修改，请谨慎填写。
          </div>
        </Form>
      </Modal>

      <Modal
        title='暂停机构'
        open={!!suspending}
        onCancel={() => setSuspending(null)}
        onOk={() => suspendForm.submit()}
        confirmLoading={actionMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={suspendForm}
          layout='vertical'
          onFinish={async (values) => {
            if (!suspending) {
              return;
            }
            await actionMutation.mutateAsync({
              id: suspending.id,
              type: "suspend",
              reason: values.reason,
            });
            message.success("机构已暂停");
            setSuspending(null);
            suspendForm.resetFields();
          }}
        >
          <Form.Item label='机构名称'>
            <Input value={suspending?.name} readOnly />
          </Form.Item>
          <Form.Item
            name='reason'
            label='暂停原因'
            rules={[{ required: true, message: "请输入暂停原因" }]}
          >
            <Input.TextArea rows={4} placeholder='请输入暂停原因' />
          </Form.Item>
          <div style={{ color: "#ff7a45", marginTop: "12px" }}>
            暂停后该机构课程将对学员不可见，无法新建订单；已有进行中的订单不受影响。
          </div>
        </Form>
      </Modal>
    </div>
  );
};
