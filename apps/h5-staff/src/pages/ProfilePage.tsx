import { Button, Card, Descriptions, Space, Typography, message } from "antd";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, setSession } from "../auth/session";
import { staffApi } from "../services/staffApi";
import type { StaffProfile } from "../types/domain";

export const ProfilePage = (): ReactElement => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      try {
        const payload = await staffApi.getProfile();
        if (mounted) {
          setProfile(payload);
          const currentSession = getSession();
          if (currentSession) {
            setSession({
              ...currentSession,
              staffProfile: payload,
            });
          }
        }
      } catch {
        if (mounted) {
          message.error("个人信息加载失败，请稍后重试");
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
  }, []);

  const logout = (): void => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const contractTypeLabel =
    profile?.contractType === "EMPLOYEE" ? "员工制" : "代理制";

  return (
    <div className='page-stack'>
      <Card loading={loading} title='个人信息'>
        <Descriptions column={1} size='small'>
          <Descriptions.Item label='姓名'>
            {profile?.name ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label='工号'>
            {profile?.staffId ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label='手机号'>
            {profile?.phone ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label='合同类型'>
            {profile
              ? `${contractTypeLabel}${profile.groupName ? ` · ${profile.groupName}` : ""}`
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Space direction='vertical' style={{ width: "100%" }}>
          <Button block onClick={() => navigate("/students")}>
            我的学员
          </Button>
          <Button block onClick={() => navigate("/commissions")}>
            提成明细
          </Button>
        </Space>
      </Card>

      <Card>
        <Typography.Paragraph type='secondary'>
          退出后将清除本地会话，需要重新登录。
        </Typography.Paragraph>
        <Button danger block onClick={logout}>
          退出登录
        </Button>
      </Card>
    </div>
  );
};
