import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Typography, Tag } from "antd";
import {
  DashboardOutlined,
  BankOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";
import { useAdminAuthStore } from "../store/auth";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "运营概览" },
  { key: "/orgs", icon: <BankOutlined />, label: "机构管理" },
  { key: "/staff", icon: <TeamOutlined />, label: "业务员管理" },
  { key: "/report", icon: <BarChartOutlined />, label: "数据报表" },
  { key: "/settlement", icon: <AccountBookOutlined />, label: "结算管理" },
  { key: "/config", icon: <SettingOutlined />, label: "系统配置" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAdminAuthStore();

  return (
    <Layout className='shell-layout shell-layout--admin'>
      <Sider width={248} className='shell-sider shell-sider--admin'>
        <div className='shell-brand'>
          <Text className='shell-brand-kicker'>PLATFORM CONSOLE</Text>
          <Text className='shell-brand-title'>网课超市</Text>
          <Tag color='red' className='shell-brand-tag'>
            平台运营后台
          </Tag>
        </div>
        <Menu
          theme='light'
          mode='inline'
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className='shell-menu'
        />
      </Sider>
      <Layout>
        <Header className='shell-header'>
          <div className='shell-header-copy'>
            <Text className='shell-header-kicker'>平台总控</Text>
            <Text className='shell-header-title'>
              统一查看机构、业务员与健康指标
            </Text>
          </div>
          <Button
            icon={<LogoutOutlined />}
            type='text'
            className='shell-header-button'
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            退出
          </Button>
        </Header>
        <Content className='shell-content'>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
