import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#2563EB",
          colorInfo: "#2563EB",
          colorSuccess: "#12805C",
          colorWarning: "#C26A18",
          colorError: "#D14343",
          borderRadius: 18,
          wireframe: false,
          fontFamily: "Avenir Next, PingFang SC, Segoe UI, sans-serif",
          colorBgLayout: "#eef2f6",
          colorBgContainer: "#ffffff",
          colorText: "#1f2937",
        },
        components: {
          Card: {
            borderRadiusLG: 24,
            headerHeight: 68,
          },
          Button: {
            controlHeight: 42,
            controlHeightLG: 46,
            fontWeight: 600,
          },
          Table: {
            headerBg: "#f8f7f4",
            headerColor: "#334155",
            rowHoverBg: "#f8fafc",
            borderColor: "#edf0f4",
          },
          Input: {
            controlHeightLG: 46,
          },
          Menu: {
            itemBorderRadius: 14,
            itemHeight: 48,
            itemMarginInline: 0,
            itemMarginBlock: 6,
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
