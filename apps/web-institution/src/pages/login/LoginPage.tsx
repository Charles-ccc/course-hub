import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useAuthStore } from "../../store/auth";
import { orgApi } from "../../services/api";

const { Title, Text } = Typography;

// 开发期内置账号：后端未启动时也能进入系统查看页面
const DEV_ACCOUNT = { phone: "18827666283", password: "Admin123" };

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const res: any = await orgApi.login(values.phone, values.password);
      setAuth(res.token, res.orgId, res.orgName);
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
          <span className='auth-badge'>ORG WORKSPACE</span>
          <span className='auth-brand'>网课超市</span>
          <span className='auth-title'>机构管理后台</span>
          <span className='auth-subtitle'>
            统一处理课程、订单、逾期与结算，把机构侧的日常高频动作整理成更顺手的工作区。
          </span>

          <div className='auth-helper-grid'>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>课程</span>
              <span className='auth-helper-value'>
                统一维护价格、分期数与上下线状态
              </span>
            </div>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>订单</span>
              <span className='auth-helper-value'>
                查看学员签约状态与履约进度
              </span>
            </div>
            <div className='auth-helper-item'>
              <span className='auth-helper-label'>结算</span>
              <span className='auth-helper-value'>
                保证金、服务费和逾期动作集中处理
              </span>
            </div>
          </div>
        </div>

        <Card className='auth-card'>
          <Title level={3} className='auth-card-title'>
            登录机构后台
          </Title>
          <Text className='auth-card-subtitle'>
            输入机构账号，进入课程与订单工作区
          </Text>
          <Form
            layout='vertical'
            onFinish={handleLogin}
            initialValues={DEV_ACCOUNT}
          >
            <Form.Item
              name='phone'
              label='手机号'
              rules={[{ required: true, message: "请输入手机号" }]}
            >
              <Input size='large' placeholder='请输入手机号' />
            </Form.Item>
            <Form.Item
              name='password'
              label='密码'
              rules={[{ required: true, message: "请输入密码" }]}
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
              进入工作区
            </Button>
          </Form>
          <Text className='auth-dev-note'>
            开发账号：{DEV_ACCOUNT.phone} / {DEV_ACCOUNT.password}
          </Text>
        </Card>
      </div>
    </div>
  );
}
