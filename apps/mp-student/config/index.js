const config = {
  projectName: "mp-student",
  date: "2024-01-01",
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: "src",
  outputRoot: "dist",
  plugins: [],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: "react",
  compiler: "webpack5",
  cache: { enable: false },
  env: {
    TARO_APP_API_URL: JSON.stringify(
      process.env.TARO_APP_API_URL || "http://localhost:3000",
    ),
    TARO_APP_SHARE_URL: JSON.stringify(
      process.env.TARO_APP_SHARE_URL || "https://mp.wangke.com",
    ),
    TARO_APP_USE_FRONTEND_MOCK: JSON.stringify(
      process.env.TARO_APP_USE_FRONTEND_MOCK || "false",
    ),
  },
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      url: { enable: true, config: { limit: 1024 } },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    esnextModules: ["nutui-react"],
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false },
    },
    devServer: {
      port: 10086,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === "development") {
    return merge({}, config, require("./dev"));
  }
  return merge({}, config, require("./prod"));
};
