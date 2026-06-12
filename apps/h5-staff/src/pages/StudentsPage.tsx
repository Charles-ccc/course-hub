import {
  Card,
  Empty,
  Flex,
  Pagination,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { staffApi } from "../services/staffApi";
import type { StudentItem } from "../types/domain";
import { dueTagText, studentStatusLabel } from "../utils/format";

const tabItems = [
  { label: "全部", value: "all" },
  { label: "7天还款日", value: "due7" },
  { label: "还款日", value: "due" },
  { label: "已逾期", value: "overdue" },
] as const;

type StudentTab = (typeof tabItems)[number]["value"];
const tabOptions = [...tabItems];

export const StudentsPage = (): ReactElement => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StudentTab>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<StudentItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await staffApi.getStudents({
          page,
          pageSize: 20,
          tab,
        });
        if (!mounted) {
          return;
        }
        setItems(response.items);
        setTotal(response.total);
      } catch {
        if (mounted) {
          message.error("学员列表加载失败，请稍后重试");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [page, tab]);

  const emptyText =
    tab === "all"
      ? "暂无学员"
      : tab === "overdue"
        ? "暂无逾期学员"
        : "暂无符合条件的学员";

  return (
    <div className='page-stack'>
      <Card>
        <Segmented
          options={tabOptions}
          value={tab}
          onChange={(value) => {
            setTab(value as StudentTab);
            setPage(1);
          }}
          block
        />
      </Card>

      {items.length === 0 && !loading ? (
        <Card>
          <Empty description={emptyText} />
        </Card>
      ) : (
        <Space direction='vertical' style={{ width: "100%" }}>
          {items.map((item) => {
            const dueText = dueTagText(item.nextDueDate, item.overdueDays);
            return (
              <Card key={item.id} loading={loading}>
                <Flex justify='space-between'>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Tag
                    color={
                      item.status === "OVERDUE"
                        ? "red"
                        : item.status === "COMPLETED"
                          ? "blue"
                          : "green"
                    }
                  >
                    {studentStatusLabel[item.status]}
                  </Tag>
                </Flex>
                <Typography.Paragraph
                  type='secondary'
                  style={{ marginBottom: 8 }}
                >
                  {item.phone}
                </Typography.Paragraph>
                <Typography.Text>
                  学习进度：{item.progressFinishedCount}/
                  {item.progressTotalCount}
                </Typography.Text>
                {dueText ? (
                  <div style={{ marginTop: 8 }}>
                    <Tag color={item.overdueDays > 0 ? "red" : "gold"}>
                      {dueText}
                    </Tag>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </Space>
      )}

      <Card>
        <Pagination
          current={page}
          pageSize={20}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
          simple
        />
      </Card>
    </div>
  );
};
