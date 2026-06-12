import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("/antd/") ||
            id.includes("/@ant-design/") ||
            id.includes("/@rc-component/")
          ) {
            return "pkg-antd";
          }

          if (id.includes("/react-router")) {
            return "pkg-react-router";
          }

          if (id.includes("/axios/")) {
            return "pkg-axios";
          }

          if (id.includes("/@tanstack/")) {
            return "pkg-query";
          }

          if (id.includes("/dayjs/")) {
            return "pkg-dayjs";
          }

          if (id.includes("/qrcode/")) {
            return "pkg-qrcode";
          }

          return "vendor";
        },
      },
    },
  },
});
