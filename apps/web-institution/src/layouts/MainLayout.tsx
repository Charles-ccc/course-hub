import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Typography } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  OrderedListOutlined,
  AccountBookOutlined,
  WarningOutlined,
  MessageOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/auth";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "概览" },
  { key: "/courses", icon: <BookOutlined />, label: "课程管理" },
  { key: "/orders", icon: <OrderedListOutlined />, label: "订单管理" },
  { key: "/overdue", icon: <WarningOutlined />, label: "逾期管理" },
  { key: "/settlement", icon: <AccountBookOutlined />, label: "结算对账" },
  { key: "/qa", icon: <MessageOutlined />, label: "答疑管理" },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orgName, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout className='shell-layout'>
      <Sider width={248} className='shell-sider'>
        <div className='shell-brand'>
          <Text className='shell-brand-kicker'>ORG WORKSPACE</Text>
          <Text className='shell-brand-title'>网课超市</Text>
          <Text className='shell-brand-subtitle'>机构管理后台</Text>
        </div>
        <Menu
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
            <Text className='shell-header-kicker'>机构工作区</Text>
            <Text className='shell-header-title'>
              {orgName || "未命名机构"}
            </Text>
          </div>
          <Button
            icon={<LogoutOutlined />}
            type='text'
            className='shell-header-button'
            onClick={handleLogout}
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
