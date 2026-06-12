import { Card, Empty, Pagination, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { staffApi } from "../services/staffApi";
import type { CommissionItem, CommissionSummary } from "../types/domain";
import {
  centsToYuan,
  commissionStatusLabel,
  commissionTypeLabel,
  formatDateTime,
} from "../utils/format";

export const CommissionsPage = (): ReactElement => {
  const [summary, setSummary] = useState<CommissionSummary>({
    settledCents: 0,
    pendingCents: 0,
    heldCents: 0,
  });
  const [items, setItems] = useState<CommissionItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const [summaryResp, listResp] = await Promise.all([
          staffApi.getSummary(),
          staffApi.getCommissions({ page, pageSize: 20 }),
        ]);
        if (!mounted) {
          return;
        }
        setSummary(summaryResp);
        setItems(listResp.items);
        setTotal(listResp.total);
      } catch {
        if (mounted) {
          message.error("提成明细加载失败，请稍后重试");
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
  }, [page]);

  return (
    <div className='page-stack'>
      <Card title='提成汇总'>
        <Space size='large'>
          <Typography.Text>
            已结算: {centsToYuan(summary.settledCents)}
          </Typography.Text>
          <Typography.Text>
            待结算: {centsToYuan(summary.pendingCents)}
          </Typography.Text>
          <Typography.Text>
            暂缓: {centsToYuan(summary.heldCents)}
          </Typography.Text>
        </Space>
      </Card>

      {items.length === 0 && !loading ? (
        <Card>
          <Empty description='暂无提成明细' />
        </Card>
      ) : (
        <Space direction='vertical' style={{ width: "100%" }}>
          {items.map((item) => (
            <Card key={item.id} loading={loading}>
              <Space direction='vertical' style={{ width: "100%" }}>
                <Typography.Text strong>
                  {commissionTypeLabel(item.type, item.periodNo)}
                </Typography.Text>
                <Typography.Text type='secondary'>
                  {item.studentName} · {item.courseName}
                </Typography.Text>
                <Typography.Text>
                  金额：{centsToYuan(item.amountCents)} 元
                </Typography.Text>
                <Typography.Text type='secondary'>
                  发生时间：{formatDateTime(item.createdAt)}
                </Typography.Text>
                <Tag
                  color={
                    item.status === "SETTLED"
                      ? "green"
                      : item.status === "PENDING"
                        ? "gold"
                        : item.status === "HELD"
                          ? "blue"
                          : "red"
                  }
                >
                  {commissionStatusLabel[item.status]}
                </Tag>
              </Space>
            </Card>
          ))}
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
