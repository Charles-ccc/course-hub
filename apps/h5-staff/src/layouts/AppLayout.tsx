import { Layout, Menu, Typography } from "antd";
import type { ReactElement } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../auth/session";

const { Header, Content } = Layout;

const menuItems = [
  { key: "/home", label: <Link to='/home'>首页</Link> },
  { key: "/students", label: <Link to='/students'>我的学员</Link> },
  { key: "/commissions", label: <Link to='/commissions'>提成明细</Link> },
  { key: "/profile", label: <Link to='/profile'>我的</Link> },
];

export const AppLayout = (): ReactElement => {
  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 12,
        }}
      >
        <Typography.Text strong>
          业务员工作台 {session?.staffProfile.name ?? ""}
        </Typography.Text>
        <Typography.Link onClick={handleLogout}>退出</Typography.Link>
      </Header>
      <Content className='mobile-content'>
        <Outlet />
      </Content>
      <Menu
        mode='horizontal'
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ position: "sticky", bottom: 0, zIndex: 10 }}
      />
    </Layout>
  );
};
