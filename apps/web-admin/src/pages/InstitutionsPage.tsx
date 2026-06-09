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

export const InstitutionsPage = (): ReactElement => {
  const [tab, setTab] = useState<Institution["status"] | "ALL">("ALL");
  const [approving, setApproving] = useState<Institution | null>(null);
  const [suspending, setSuspending] = useState<Institution | null>(null);
  const [approveForm] = Form.useForm<{ settlementRate: number }>();
  const [suspendForm] = Form.useForm<{ reason: string }>();
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
        <>
          {record.status === "PENDING" ? (
            <Button type='link' onClick={() => setApproving(record)}>
              审核通过
            </Button>
          ) : null}
          {record.status === "ACTIVE" ? (
            <Button type='link' danger onClick={() => setSuspending(record)}>
              暂停
            </Button>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <div className='page-stack'>
      <Card title='机构管理'>
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
        </Form>
      </Modal>
    </div>
  );
};
