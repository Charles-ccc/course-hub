import { useEffect, useState } from "react";
import { Card, List, Input, Button, Tag, message, Typography } from "antd";
import { orgApi } from "../../services/api";

const { Title, Text } = Typography;

type QaItem = {
  id: string;
  student: string;
  question: string;
  createdAt: string;
  replied: boolean;
  reply?: string;
  repliedAt?: string;
};

export default function QaPage() {
  const [questions, setQuestions] = useState<QaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string>();
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    orgApi
      .getQaList()
      .then((response: any) => setQuestions(response.items || []))
      .catch((error: any) => message.error(error.message || "加载答疑失败"))
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (id: string) => {
    const content = replyText[id]?.trim();
    if (!content) {
      message.warning("请输入回复内容");
      return;
    }

    setReplyingId(id);
    try {
      const updated: any = await orgApi.replyQa(id, content);
      setQuestions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
      setReplyText((prev) => ({ ...prev, [id]: "" }));
      message.success("回复成功，已写入 mock 留痕");
    } catch (error: any) {
      message.error(error.message || "回复失败");
    } finally {
      setReplyingId(undefined);
    }
  };

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Support</Text>
          <Title level={2} className='page-title'>
            答疑管理
          </Title>
          <Text className='page-subtitle'>
            按待回复状态集中处理学员咨询，降低回复上下文切换成本。
          </Text>
        </div>
      </div>
      <Card title='问题列表' className='section-card'>
        <List
          loading={loading}
          dataSource={questions}
          renderItem={(item) => (
            <List.Item
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <div style={{ width: "100%", marginBottom: 8 }}>
                <Tag color={item.replied ? "green" : "orange"}>
                  {item.replied ? "已回复" : "待回复"}
                </Tag>
                <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>
                  {item.student} · {item.createdAt}
                </span>
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                {item.question}
              </div>
              {item.reply && (
                <div
                  style={{
                    background: "#F0FDF4",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#059669",
                    marginBottom: 8,
                  }}
                >
                  回复：{item.reply}
                </div>
              )}
              {!item.replied && (
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <Input.TextArea
                    rows={2}
                    style={{ flex: 1 }}
                    placeholder='输入回复...'
                    value={replyText[item.id] || ""}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [item.id]: e.target.value })
                    }
                  />
                  <Button
                    type='primary'
                    loading={replyingId === item.id}
                    onClick={() => handleReply(item.id)}
                  >
                    回复
                  </Button>
                </div>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
