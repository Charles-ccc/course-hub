import { Button, Card, Form, InputNumber, Switch, message } from "antd";
import { useEffect } from "react";
import type { ReactElement } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type { SystemConfig } from "../types/domain";

export const SystemConfigPage = (): ReactElement => {
  const [form] = Form.useForm<SystemConfig>();

  const configQuery = useQuery({
    queryKey: ["admin-system-config"],
    queryFn: adminApi.getSystemConfig,
  });

  const updateMutation = useMutation({
    mutationFn: adminApi.updateSystemConfig,
    onSuccess: () => {
      message.success("系统配置已保存");
    },
  });

  useEffect(() => {
    if (!configQuery.data) {
      return;
    }
    form.setFieldsValue(configQuery.data);
  }, [configQuery.data, form]);

  return (
    <div className='page-stack'>
      <Card title='系统配置'>
        <Form
          form={form}
          layout='vertical'
          onFinish={(values) => updateMutation.mutate(values)}
        >
          <Form.Item
            name='priceLimitCents'
            label='课程最高限价（分）'
            rules={[{ required: true, message: "请输入最高限价" }]}
          >
            <InputNumber min={100} style={{ width: "100%" }} precision={0} />
          </Form.Item>
          <Form.Item
            name='minAge'
            label='最小年龄'
            rules={[{ required: true, message: "请输入最小年龄" }]}
          >
            <InputNumber
              min={6}
              max={30}
              style={{ width: "100%" }}
              precision={0}
            />
          </Form.Item>
          <Form.Item
            name='maxAge'
            label='最大年龄'
            rules={[{ required: true, message: "请输入最大年龄" }]}
          >
            <InputNumber
              min={6}
              max={30}
              style={{ width: "100%" }}
              precision={0}
            />
          </Form.Item>
          <Form.Item
            name='zhimaEnabled'
            label='芝麻信用准入'
            valuePropName='checked'
          >
            <Switch checkedChildren='启用' unCheckedChildren='关闭' />
          </Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            loading={updateMutation.isPending}
          >
            保存配置
          </Button>
        </Form>
      </Card>
    </div>
  );
};
