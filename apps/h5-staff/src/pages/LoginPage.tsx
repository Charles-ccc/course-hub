import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { setSession } from "../auth/session";
import { ApiBusinessError } from "../services/apiError";
import { staffApi } from "../services/staffApi";

interface LoginForm {
  phone: string;
  password: string;
}

export const LoginPage = (): ReactElement => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm): Promise<void> => {
    setLoading(true);
    try {
      const session = await staffApi.login(values);
      setSession(session);
      message.success("登录成功");
      navigate("/home", { replace: true });
    } catch (error) {
      message.error(
        error instanceof ApiBusinessError
          ? error.message
          : "登录失败，请检查手机号或密码",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          业务员工作台
        </Typography.Title>
        <Typography.Paragraph type='secondary'>
          仅限已审核的业务员使用
        </Typography.Paragraph>
        <Form<LoginForm>
          layout='vertical'
          onFinish={onFinish}
          autoComplete='off'
        >
          <Form.Item
            name='phone'
            label='手机号'
            rules={[{ required: true, message: "请输入手机号" }]}
          >
            <Input placeholder='请输入手机号' />
          </Form.Item>
          <Form.Item
            name='password'
            label='密码'
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder='请输入密码' />
          </Form.Item>
          <Button type='primary' htmlType='submit' loading={loading} block>
            {loading ? "登录中..." : "登录"}
          </Button>
        </Form>
      </Card>
    </div>
  );
};
