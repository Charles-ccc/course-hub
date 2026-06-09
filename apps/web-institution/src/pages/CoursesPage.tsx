import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiBusinessError, BUSINESS_ERROR_CODES } from "../services/apiError";
import { institutionApi } from "../services/institutionApi";
import type { Course } from "../types/domain";
import { centsToYuan } from "../utils/format";

interface CreateCourseForm {
  name: string;
  description: string;
  instructorInfo: string;
  priceYuan: number;
  periodCount: number;
}

export const CoursesPage = (): ReactElement => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CreateCourseForm>();
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: institutionApi.getCourses,
  });

  const createMutation = useMutation({
    mutationFn: institutionApi.createCourse,
    onSuccess: async () => {
      message.success("课程创建成功");
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      if (
        error instanceof ApiBusinessError &&
        error.code === BUSINESS_ERROR_CODES.PRICE_LIMIT_EXCEEDED
      ) {
        message.error(error.message);
        return;
      }
      message.error(
        error instanceof ApiBusinessError
          ? error.message
          : "创建失败，请稍后重试",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Course["status"] }) =>
      institutionApi.updateCourseStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const handleStatusToggle = (course: Course): void => {
    const targetStatus = course.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    const title = targetStatus === "ONLINE" ? "确认上架课程" : "确认下架课程";
    const content =
      targetStatus === "ONLINE"
        ? "上架后学员将可以在小程序中看到并购买此课程，是否继续？"
        : "下架后学员将无法发现和购买此课程，已有进行中的订单不受影响，是否继续？";

    Modal.confirm({
      title,
      content,
      onOk: async () => {
        await statusMutation.mutateAsync({
          id: course.id,
          status: targetStatus,
        });
        message.success("课程状态已更新");
      },
    });
  };

  const columns: ColumnsType<Course> = [
    { title: "课程名称", dataIndex: "name" },
    {
      title: "讲师信息",
      dataIndex: "instructorInfo",
      render: (value: string) => (
        <Typography.Paragraph ellipsis>{value}</Typography.Paragraph>
      ),
    },
    {
      title: "课程总价（元）",
      dataIndex: "priceCents",
      render: (value: number) => centsToYuan(value),
    },
    { title: "分期期数", dataIndex: "periodCount" },
    {
      title: "每期金额（元）",
      render: (_, record) =>
        centsToYuan(Math.floor(record.priceCents / record.periodCount)),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: Course["status"]) =>
        status === "ONLINE" ? <Tag color='green'>上架</Tag> : <Tag>下架</Tag>,
    },
    {
      title: "操作",
      render: (_, record) => (
        <Button type='link' onClick={() => handleStatusToggle(record)}>
          {record.status === "ONLINE" ? "下架" : "上架"}
        </Button>
      ),
    },
  ];

  return (
    <div className='page-stack'>
      <Card
        title='课程管理'
        extra={
          <Button type='primary' onClick={() => setOpen(true)}>
            新建课程
          </Button>
        }
      >
        <Table<Course>
          rowKey='id'
          dataSource={coursesQuery.data ?? []}
          columns={columns}
          loading={coursesQuery.isLoading}
          pagination={false}
        />
      </Card>

      <Modal
        title='新建课程'
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
            name='name'
            label='课程名称'
            rules={[
              { required: true, message: "请输入课程名称" },
              { max: 100 },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item
            name='description'
            label='课程简介'
            rules={[
              { required: true, message: "请输入课程简介" },
              { max: 2000 },
            ]}
          >
            <Input.TextArea rows={4} maxLength={2000} />
          </Form.Item>
          <Form.Item
            name='instructorInfo'
            label='讲师信息'
            rules={[
              { required: true, message: "请输入讲师信息" },
              { max: 500 },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
          <Space size={16} style={{ width: "100%" }}>
            <Form.Item
              name='priceYuan'
              label='课程总价（元）'
              style={{ flex: 1 }}
              rules={[{ required: true, message: "请输入课程总价" }]}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name='periodCount'
              label='分期期数'
              style={{ flex: 1 }}
              rules={[{ required: true, message: "请输入分期期数" }]}
            >
              <InputNumber
                min={1}
                max={36}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};
