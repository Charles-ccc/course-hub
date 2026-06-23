// 支付宝小程序 IDE 不能直接请求本地 HTTP 接口；本地调试前端时也需要走白名单内的 HTTPS API。
const config = {
  dev: {
    baseUrl: "http://127.0.0.1:3000/api/v1",
  },
  prod: {
    baseUrl: "https://api.happymaa.cn/api/v1",
  },
};

const env = "prod";

module.exports = config[env];
