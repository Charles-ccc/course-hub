import { Button, Card, Input, Modal, Table, Tag, Tabs, message } from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { AdminCourse } from "../types/domain";
import { centsToYuan, courseAuditStatusLabel } from "../utils/format";

export const CoursesPage = (): ReactElement => {
  const [tab, setTab] = useState<"APPROVED" | "PENDING_REVIEW">("APPROVED");
  const [rejecting, setRejecting] = useState<AdminCourse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["admin-courses", tab],
    queryFn: () => adminApi.getCourses(tab),
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
    { title: "所属机构", dataIndex: "institutionName" },
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
          <Button type='link' danger onClick={() => handleOffline(record)}>
            下架
          </Button>
        ) : (
          <>
            <Button
              type='link'
              onClick={() =>
                actionMutation.mutate({ action: "approve", record })
              }
            >
              审核通过
            </Button>
            <Button type='link' danger onClick={() => setRejecting(record)}>
              驳回
            </Button>
          </>
        ),
    },
  ];

  return (
    <div className='page-stack'>
      <Card title='课程管理'>
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
        title='驳回课程'
        open={!!rejecting}
        onCancel={() => {
          setRejecting(null);
          setRejectReason("");
        }}
        onOk={async () => {
          if (!rejecting) {
            return;
          }
          await actionMutation.mutateAsync({
            action: "reject",
            record: rejecting,
            reason: rejectReason,
          });
          message.success("课程已驳回");
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
