import { Layout, Menu, Typography } from "antd";
import { useMemo } from "react";
import type { ReactElement } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../auth/session";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/dashboard", label: <Link to='/dashboard'>运营概览</Link> },
  { key: "/courses", label: <Link to='/courses'>课程管理</Link> },
  { key: "/orders", label: <Link to='/orders'>订单管理</Link> },
  { key: "/overdue", label: <Link to='/overdue'>逾期管理</Link> },
  { key: "/settlements", label: <Link to='/settlements'>结算对账</Link> },
  { key: "/qa", label: <Link to='/qa'>答疑管理</Link> },
];

export const AppLayout = (): ReactElement => {
  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKeys = useMemo(() => {
    const matched = menuItems.find((item) =>
      location.pathname.startsWith(item.key),
    );
    return matched ? [matched.key] : ["/dashboard"];
  }, [location.pathname]);

  const handleLogout = (): void => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme='light' width={220}>
        <div style={{ padding: "18px 16px", fontWeight: 700 }}>
          机构管理门户
        </div>
        <Menu mode='inline' selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 20,
          }}
        >
          <Typography.Text>{session?.orgName ?? "机构"}</Typography.Text>
          <Typography.Link onClick={handleLogout}>退出登录</Typography.Link>
        </Header>
        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
