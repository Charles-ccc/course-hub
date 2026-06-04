import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useAdminAuthStore } from "../../store/auth";
import { adminApi } from "../../services/api";

const DEV_ACCOUNT = { username: "admin", password: "admin123" };

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((s) => s.setAuth);

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res: any = await adminApi.login(values.username, values.password);
      setAuth(res.token, res.role);
      navigate("/dashboard");
    } catch (e: any) {
      message.error(e.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-page'>
      <div className='auth-panel'>
        <div className='auth-copy'>
          <span className='auth-badge'>PLATFORM ADMIN</span>
          <span className='auth-brand'>网课超市</span>
          <span className='auth-title'>平台运营后台</span>
          <span className='auth-subtitle'>
            统一查看机构审核、业务员状态、平台配置与健康指标，把运营动作收进同一套简洁界面。
          </span>

          <div className='auth-helper-grid'>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>机构审核</span>
              <span className='auth-helper-value'>
                准入状态、费率与保证金一处管理
              </span>
            </div>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>业务员</span>
              <span className='auth-helper-value'>
                名下学员与提成状态统一查看
              </span>
            </div>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>平台报表</span>
              <span className='auth-helper-value'>
                GMV、逾期率、退课率快速对比
              </span>
            </div>
          </div>
        </div>

        <Card className='auth-card'>
          <Typography.Title level={3} className='auth-card-title'>
            登录平台后台
          </Typography.Title>
          <Typography.Text className='auth-card-subtitle'>
            使用运营账号进入统一控制台
          </Typography.Text>
          <Form
            layout='vertical'
            onFinish={handleLogin}
            initialValues={DEV_ACCOUNT}
          >
            <Form.Item
              name='username'
              label='账号'
              rules={[{ required: true }]}
            >
              <Input size='large' placeholder='请输入账号' />
            </Form.Item>
            <Form.Item
              name='password'
              label='密码'
              rules={[{ required: true }]}
            >
              <Input.Password size='large' placeholder='请输入密码' />
            </Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              size='large'
              block
              loading={loading}
            >
              进入控制台
            </Button>
          </Form>
          <Typography.Text className='auth-dev-note'>
            开发账号：{DEV_ACCOUNT.username} / {DEV_ACCOUNT.password}
          </Typography.Text>
        </Card>
      </div>
    </div>
  );
}
