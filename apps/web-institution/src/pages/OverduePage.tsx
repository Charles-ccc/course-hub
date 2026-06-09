import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { institutionApi } from "../services/institutionApi";
import type { OverduePeriod } from "../types/domain";
import { centsToYuan, formatDate, maskName } from "../utils/format";

export const OverduePage = (): ReactElement => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<OverduePeriod | null>(null);
  const [remark, setRemark] = useState("");
  const queryClient = useQueryClient();

  const overduesQuery = useQuery({
    queryKey: ["overdues"],
    queryFn: institutionApi.getOverdues,
  });

  const writeoffMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      institutionApi.writeoffOverdue(id, value),
    onSuccess: async () => {
      message.success("核销成功");
      setOpen(false);
      setRemark("");
      setTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["overdues"] });
    },
  });

  const columns: ColumnsType<OverduePeriod> = [
    { title: "订单号", dataIndex: "orderId" },
    {
      title: "学员",
      dataIndex: "studentName",
      render: (v: string) => maskName(v),
    },
    { title: "课程名称", dataIndex: "courseName" },
    { title: "期次", render: (_, row) => `第 ${row.periodNo} 期` },
    {
      title: "应还日期",
      dataIndex: "dueDate",
      render: (v: string) => formatDate(v),
    },
    {
      title: "逾期天数",
      render: (_, row) => dayjs().diff(dayjs(row.dueDate), "day"),
    },
    {
      title: "计划金额（元）",
      dataIndex: "plannedAmountCents",
      render: (v: number) => centsToYuan(v),
    },
    {
      title: "操作",
      render: (_, row) => (
        <Button
          danger
          onClick={() => {
            setTarget(row);
            setOpen(true);
          }}
        >
          坏账核销
        </Button>
      ),
    },
  ];

  return (
    <div className='page-stack'>
      <Alert
        type='warning'
        showIcon
        message='平台明确禁止任何形式的催收骚扰行为。逾期处置的唯一合法手段是在本页面执行坏账核销。'
      />
      <Card title='逾期管理'>
        <Table<OverduePeriod>
          rowKey='id'
          dataSource={overduesQuery.data ?? []}
          columns={columns}
          loading={overduesQuery.isLoading}
        />
      </Card>

      <Modal
        open={open}
        title='确认坏账核销'
        onCancel={() => setOpen(false)}
        onOk={async () => {
          if (!target) return;
          if (!remark.trim()) {
            message.error("请填写核销备注");
            return;
          }
          await writeoffMutation.mutateAsync({
            id: target.id,
            value: remark.trim(),
          });
        }}
        okButtonProps={{ danger: true, loading: writeoffMutation.isPending }}
      >
        <Typography.Paragraph>
          学员：{maskName(target?.studentName ?? "-")}，课程：
          {target?.courseName ?? "-"}，期次：
          {target ? `第 ${target.periodNo} 期` : "-"}，计划金额（元）：
          {target ? centsToYuan(target.plannedAmountCents) : "-"}
        </Typography.Paragraph>
        <Typography.Paragraph type='warning'>
          核销操作不可撤销。核销后该期款项视为机构自行核销，平台不参与追偿。
        </Typography.Paragraph>
        <Form layout='vertical'>
          <Form.Item label='核销备注' required>
            <Input.TextArea
              rows={4}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder='如：学员失联、无力偿还'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
