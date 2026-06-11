import {
  Button,
  Card,
  Input,
  Modal,
  Table,
  Tag,
  Tabs,
  message,
  Form,
  InputNumber,
  Select,
  Space,
} from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { AdminCourse, Insitution } from "../types/domain";
import { centsToYuan, courseAuditStatusLabel } from "../utils/format";

type FormMode = "create" | "edit";

interface FormValues {
  insitutionId: string;
  name: string;
  description: string;
  instructorInfo: string;
  priceCents: number;
  periodCount: number;
}

export const CoursesPage = (): ReactElement => {
  const [tab, setTab] = useState<"APPROVED" | "PENDING_REVIEW">("APPROVED");
  const [rejecting, setRejecting] = useState<AdminCourse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["admin-courses", tab],
    queryFn: () => adminApi.getCourses(tab),
  });

  const insitutionsQuery = useQuery({
    queryKey: ["admin-insitutions-active"],
    queryFn: () => adminApi.getInsitutions("ACTIVE"),
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: {
      action: "offline" | "approve" | "reject";
      record: AdminCourse;
      reason?: string;
    }) => {
      if (payload.action === "offline") {
        return adminApi.offlineCourse(payload.record.id);
      }
      if (payload.action === "approve") {
        return adminApi.approveCourse(payload.record.id);
      }
      return adminApi.rejectCourse(payload.record.id, payload.reason ?? "");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      insitutionId: string;
      name: string;
      description: string;
      instructorInfo: string;
      priceCents: number;
      periodCount: number;
    }) => adminApi.createCourse(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      message.success("课程创建成功");
      setFormMode(null);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      data: {
        name?: string;
        description?: string;
        instructorInfo?: string;
        priceCents?: number;
        periodCount?: number;
      };
    }) => adminApi.updateCourse(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      message.success("课程编辑成功");
      setFormMode(null);
      setEditingCourse(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCourse(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      message.success("课程已删除");
      setDeleting(null);
    },
  });

  const tabItems: TabsProps["items"] = [
    { key: "APPROVED", label: "已上架课程" },
    { key: "PENDING_REVIEW", label: "课程审核" },
  ];

  const handleOffline = (course: AdminCourse): void => {
    Modal.confirm({
      title: "确认下架课程",
      content: "下架后课程将对学员端不可见，已有订单不受影响。",
      onOk: async () => {
        await actionMutation.mutateAsync({ action: "offline", record: course });
        message.success("课程状态已更新");
      },
    });
  };

  const columns: ColumnsType<AdminCourse> = [
    { title: "课程名称", dataIndex: "name" },
    { title: "所属机构", dataIndex: "insitutionName" },
    {
      title: "课程总价（元）",
      dataIndex: "priceCents",
      render: (value: number) => centsToYuan(value),
    },
    {
      title: "审核状态",
      dataIndex: "auditStatus",
      render: (status: AdminCourse["auditStatus"]) => (
        <Tag>{courseAuditStatusLabel[status]}</Tag>
      ),
    },
    {
      title: "操作",
      render: (_, record) =>
        tab === "APPROVED" ? (
          <Space>
            <Button
              type='link'
              danger
              size='small'
              onClick={() => handleOffline(record)}
            >
              下架
            </Button>
          </Space>
        ) : (
          <Space>
            {record.auditStatus === "PENDING_REVIEW" && (
              <>
                <Button
                  type='link'
                  size='small'
                  onClick={() => {
                    setEditingCourse(record);
                    setFormMode("edit");
                    form.setFieldsValue({
                      name: record.name,
                      description: record.description,
                      instructorInfo: record.instructorInfo,
                      priceCents: centsToYuan(
                        record.priceCents,
                      ) as unknown as number,
                      periodCount: record.periodCount,
                    });
                  }}
                >
                  编辑
                </Button>
                <Button
                  type='link'
                  size='small'
                  danger
                  onClick={() => setDeleting(record)}
                >
                  删除
                </Button>
              </>
            )}
            <Button
              type='link'
              size='small'
              onClick={() =>
                actionMutation.mutate({ action: "approve", record })
              }
            >
              审核通过
            </Button>
            <Button
              type='link'
              danger
              size='small'
              onClick={() => setRejecting(record)}
            >
              驳回
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div className='page-stack'>
      <Card
        title='课程管理'
        extra={
          <Button
            type='primary'
            onClick={() => {
              setFormMode("create");
              form.resetFields();
            }}
          >
            新增课程
          </Button>
        }
      >
        <Tabs
          activeKey={tab}
          items={tabItems}
          onChange={(value) => setTab(value as "APPROVED" | "PENDING_REVIEW")}
        />
        <Table<AdminCourse>
          rowKey='id'
          dataSource={coursesQuery.data ?? []}
          columns={columns}
          loading={coursesQuery.isLoading}
        />
      </Card>

      <Modal
        title={formMode === "create" ? "新增课程" : "编辑课程"}
        open={formMode !== null}
        onCancel={() => {
          setFormMode(null);
          setEditingCourse(null);
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
                insitutionId: values.insitutionId,
                name: values.name,
                description: values.description,
                instructorInfo: values.instructorInfo,
                priceCents: Math.round(values.priceCents * 100),
                periodCount: values.periodCount,
              });
            } else if (formMode === "edit" && editingCourse) {
              await updateMutation.mutateAsync({
                id: editingCourse.id,
                data: {
                  name: values.name,
                  description: values.description,
                  instructorInfo: values.instructorInfo,
                  priceCents: Math.round(values.priceCents * 100),
                  periodCount: values.periodCount,
                },
              });
            }
          }}
        >
          {formMode === "create" && (
            <Form.Item
              name='insitutionId'
              label='所属机构'
              rules={[{ required: true, message: "请选择所属机构" }]}
            >
              <Select
                placeholder='请选择所属机构'
                options={
                  insitutionsQuery.data?.map((inst: Insitution) => ({
                    label: inst.name,
                    value: inst.id,
                  })) ?? []
                }
              />
            </Form.Item>
          )}
          <Form.Item
            name='name'
            label='课程名称'
            rules={[{ required: true, message: "请输入课程名称" }]}
          >
            <Input placeholder='请输入课程名称' maxLength={100} />
          </Form.Item>
          <Form.Item
            name='description'
            label='课程简介'
            rules={[{ required: true, message: "请输入课程简介" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder='请输入课程简介'
              maxLength={2000}
            />
          </Form.Item>
          <Form.Item
            name='instructorInfo'
            label='讲师介绍'
            rules={[{ required: true, message: "请输入讲师介绍" }]}
          >
            <Input.TextArea
              rows={2}
              placeholder='请输入讲师介绍'
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            name='priceCents'
            label='课程总价（元）'
            rules={[{ required: true, message: "请输入课程价格" }]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: "100%" }}
              placeholder='请输入课程价格'
            />
          </Form.Item>
          <Form.Item
            name='periodCount'
            label='期次数'
            rules={[{ required: true, message: "请输入期次数" }]}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: "100%" }}
              placeholder='请输入课程总期次数'
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
        <p>删除后该课程记录无法恢复。</p>
        <p>
          确定要删除课程 <strong>{deleting?.name}</strong> 吗？
        </p>
      </Modal>

      <Modal
        title='驳回课程'
        open={!!rejecting}
        onCancel={() => {
          setRejecting(null);
          setRejectReason("");
        }}
        onOk={() => {
          if (!rejecting) {
            return;
          }
          actionMutation.mutate({
            action: "reject",
            record: rejecting,
            reason: rejectReason,
          });
          setRejecting(null);
          setRejectReason("");
        }}
        confirmLoading={actionMutation.isPending}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder='请输入驳回原因'
        />
      </Modal>
    </div>
  );
};
