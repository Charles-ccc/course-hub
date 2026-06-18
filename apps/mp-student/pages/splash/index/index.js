const { request, saveTokens } = require('../../../services/request');

Page({
  onLoad() {
    my.getAuthCode({
      scopes: 'auth_base',
      success: (loginRes) => {
        request({
          url: '/auth/alipay/login',
          method: 'POST',
          data: { authCode: loginRes.authCode },
          noAuth: true,
        })
          .then((res) => {
            if (res.needRegister || res.realnameStatus !== 'VERIFIED') {
              // 新用户 或 已注册但未完成实名 → 走完整注册流程
              my.redirectTo({ url: '/pages/guide/index/index' });
            } else {
              // 已注册 + 已认证 → 直接进首页
              saveTokens(res.accessToken, res.refreshToken);
              const app = getApp();
              app.globalData.accessToken = res.accessToken;
              app.globalData.studentId = res.userId;
              app.globalData.studentProfile = {
                name: res.name,
                phone: res.phone,
                realnameStatus: res.realnameStatus,
              };
              my.switchTab({ url: '/pages/index/index/index' });
            }
          })
          .catch(() => {
            my.redirectTo({ url: '/pages/guide/index/index' });
          });
      },
      fail: () => {
        my.redirectTo({ url: '/pages/guide/index/index' });
      },
    });
  },
});
