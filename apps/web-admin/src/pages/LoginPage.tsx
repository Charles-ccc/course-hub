import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { ApiBusinessError } from "../services/apiError";
import { setSession } from "../auth/session";

interface LoginForm {
  username: string;
  password: string;
}

export const LoginPage = (): ReactElement => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm): Promise<void> => {
    setLoading(true);
    try {
      const session = await adminApi.login(values);
      setSession(session);
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      message.error(
        error instanceof ApiBusinessError ? error.message : "用户名或密码错误",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          平台运营后台登录
        </Typography.Title>
        <Form<LoginForm>
          layout='vertical'
          onFinish={onFinish}
          autoComplete='off'
        >
          <Form.Item
            name='username'
            label='用户名'
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder='请输入用户名，默认 admin' />
          </Form.Item>
          <Form.Item
            name='password'
            label='密码'
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder='请输入密码' />
          </Form.Item>
          <Button type='primary' htmlType='submit' loading={loading} block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
};
