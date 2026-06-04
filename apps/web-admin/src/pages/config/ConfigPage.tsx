import { useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Divider,
  message,
  Alert,
  Typography,
} from "antd";
import { adminApi } from "../../services/api";

const { Title, Text } = Typography;

export default function ConfigPage() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await adminApi.setPriceCap(values.priceCap * 100);
      await adminApi.setCreditConfig({ zhimaEnabled: values.zhimaEnabled });
      message.success("配置已保存");
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='page-shell'>
      <div className='page-header'>
        <div className='page-intro'>
          <Text className='page-kicker'>Policy</Text>
          <Title level={2} className='page-title'>
            系统配置
          </Title>
          <Text className='page-subtitle'>
            集中维护客单价上限与信用服务开关，确保前台策略与风控约束一致。
          </Text>
        </div>
      </div>
      <Card title='配置项' className='section-card'>
        <Alert
          type='info'
          message='芝麻先享默认关闭（enabled=false），开启前请确认已完成支付宝商户接入并通过法律审核。'
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          layout='vertical'
          initialValues={{ priceCap: 10000, zhimaEnabled: false }}
          onFinish={handleSave}
        >
          <Divider orientation='left'>消费者保护</Divider>
          <Form.Item name='priceCap' label='客单价上限（元，超限不可下单）'>
            <InputNumber min={100} max={100000} style={{ width: 200 }} />
          </Form.Item>

          <Divider orientation='left'>信用服务配置</Divider>
          <Form.Item
            name='zhimaEnabled'
            label='芝麻先享（预留，默认关闭）'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>

          <Button type='primary' htmlType='submit' loading={saving}>
            保存配置
          </Button>
        </Form>
      </Card>
    </div>
  );
}
