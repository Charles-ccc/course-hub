import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { institutionApi } from "../services/institutionApi";
import type { QaQuestion } from "../types/domain";
import { formatDateTime, maskName } from "../utils/format";

const tabItems: TabsProps["items"] = [
  { key: "PENDING", label: "待回复" },
  { key: "ALL", label: "全部" },
];

export const QaPage = (): ReactElement => {
  const [tab, setTab] = useState<string>("PENDING");
  const [draftReply, setDraftReply] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const qaQuery = useQuery({
    queryKey: ["qa", tab],
    queryFn: () => institutionApi.getQuestions(tab === "PENDING"),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      institutionApi.replyQuestion(id, content),
    onSuccess: async () => {
      message.success("回复成功");
      await queryClient.invalidateQueries({ queryKey: ["qa"] });
    },
  });

  const columns: ColumnsType<QaQuestion> = [
    {
      title: "学员",
      dataIndex: "studentName",
      render: (v: string) => maskName(v),
    },
    { title: "提问内容", dataIndex: "content" },
    {
      title: "提问时间",
      dataIndex: "askedAt",
      render: (v: string) => formatDateTime(v),
    },
    {
      title: "回复状态",
      dataIndex: "replied",
      render: (replied: boolean) =>
        replied ? (
          <Tag color='green'>已回复</Tag>
        ) : (
          <Tag color='orange'>待回复</Tag>
        ),
    },
    {
      title: "回复内容",
      dataIndex: "replyContent",
      render: (v?: string) => v ?? "-",
    },
    {
      title: "回复时间",
      dataIndex: "repliedAt",
      render: (v?: string) => formatDateTime(v),
    },
  ];

  return (
    <Card title='答疑管理'>
      <Tabs activeKey={tab} items={tabItems} onChange={setTab} />
      <Table<QaQuestion>
        rowKey='id'
        dataSource={qaQuery.data ?? []}
        columns={columns}
        loading={qaQuery.isLoading}
        expandable={{
          rowExpandable: (row) => !row.replied,
          expandedRowRender: (row) => (
            <Space direction='vertical' style={{ width: "100%" }}>
              <Typography.Text>回复问题</Typography.Text>
              <Input.TextArea
                rows={4}
                value={draftReply[row.id] ?? ""}
                onChange={(e) =>
                  setDraftReply((prev) => ({
                    ...prev,
                    [row.id]: e.target.value,
                  }))
                }
              />
              <Button
                type='primary'
                loading={replyMutation.isPending}
                onClick={async () => {
                  const content = (draftReply[row.id] ?? "").trim();
                  if (!content) {
                    message.error("回复内容不能为空");
                    return;
                  }
                  await replyMutation.mutateAsync({ id: row.id, content });
                }}
              >
                提交回复
              </Button>
            </Space>
          ),
        }}
      />
    </Card>
  );
};
