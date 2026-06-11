import { Layout, Menu, Typography } from "antd";
import { useMemo } from "react";
import type { ReactElement } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../auth/session";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/dashboard", label: <Link to='/dashboard'>运营概览</Link> },
  { key: "/insitutions", label: <Link to='/insitutions'>机构管理</Link> },
  { key: "/courses", label: <Link to='/courses'>课程管理</Link> },
  { key: "/salesmen", label: <Link to='/salesmen'>业务员管理</Link> },
  { key: "/reports", label: <Link to='/reports'>数据报表</Link> },
  { key: "/settlements", label: <Link to='/settlements'>结算对账</Link> },
  { key: "/system-config", label: <Link to='/system-config'>系统配置</Link> },
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
          平台运营后台
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
          <Typography.Text>{session?.username ?? "运营账号"}</Typography.Text>
          <Typography.Link onClick={handleLogout}>退出登录</Typography.Link>
        </Header>
        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
