import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
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
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router-dom/")
          ) {
            return "react-vendor";
          }

          if (id.includes("/@tanstack/")) {
            return "query-vendor";
          }

          const packagePath = id.split("node_modules/").pop();

          if (!packagePath) {
            return "vendor";
          }

          if (packagePath.startsWith("@")) {
            const [scope, name] = packagePath.split("/");
            return `pkg-${scope.replace("@", "")}-${name}`;
          }

          const [name] = packagePath.split("/");
          return `pkg-${name}`;
        },
      },
    },
  },
});
