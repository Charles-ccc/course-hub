import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { insitutionApi } from "../services/insitutionApi";
import { ApiBusinessError } from "../services/apiError";
import { setSession } from "../auth/session";

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
      const session = await insitutionApi.login(values);
      setSession(session);
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      message.error(
        error instanceof ApiBusinessError ? error.message : "手机号或密码错误",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          机构管理门户登录
        </Typography.Title>
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
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
};
