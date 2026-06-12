import {
  Button,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { getSession } from "../auth/session";
import { staffApi } from "../services/staffApi";
import type { CommissionSummary } from "../types/domain";
import { centsToYuan } from "../utils/format";

const emptySummary: CommissionSummary = {
  settledCents: 0,
  pendingCents: 0,
  heldCents: 0,
};

export const HomePage = (): ReactElement => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CommissionSummary>(emptySummary);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const staffId = getSession()?.staffId ?? "";
  const inviteLink = useMemo(
    () => `https://mp.wangke.com/register?staff=${staffId}`,
    [staffId],
  );

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      try {
        const [summaryResp, qr] = await Promise.all([
          staffApi.getSummary(),
          QRCode.toDataURL(inviteLink),
        ]);
        if (!mounted) {
          return;
        }
        setSummary(summaryResp);
        setQrDataUrl(qr);
      } catch {
        if (mounted) {
          message.error("首页数据加载失败，请稍后重试");
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
  }, [inviteLink]);

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("复制失败，请手动复制链接");
    }
  };

  return (
    <div className='page-stack'>
      <Card title='提成汇总'>
        {loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <Typography.Text type='secondary'>已结算</Typography.Text>
              <Typography.Title level={5}>
                {centsToYuan(summary.settledCents)}
              </Typography.Title>
            </Col>
            <Col span={8}>
              <Typography.Text type='secondary'>待结算</Typography.Text>
              <Typography.Title level={5}>
                {centsToYuan(summary.pendingCents)}
              </Typography.Title>
            </Col>
            <Col span={8}>
              <Typography.Text type='secondary'>暂缓</Typography.Text>
              <Typography.Title level={5}>
                {centsToYuan(summary.heldCents)}
              </Typography.Title>
            </Col>
          </Row>
        )}
      </Card>

      <Card title='专属邀请二维码'>
        <Flex vertical gap={12} align='center'>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt='专属邀请二维码'
              width={180}
              height={180}
            />
          ) : (
            <Typography.Text copyable={{ text: inviteLink }}>
              {inviteLink}
            </Typography.Text>
          )}
          <Typography.Text type='secondary'>
            扫码后学员将自动绑定至您名下
          </Typography.Text>
          <Button onClick={copyLink}>{copied ? "已复制" : "复制链接"}</Button>
        </Flex>
      </Card>

      <Card title='快捷导航'>
        <Flex gap={12}>
          <Button block onClick={() => navigate("/students")}>
            我的学员列表
          </Button>
          <Button block onClick={() => navigate("/commissions")}>
            提成明细
          </Button>
        </Flex>
      </Card>
    </div>
  );
};
