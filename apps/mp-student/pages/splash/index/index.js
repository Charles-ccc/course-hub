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
            if (res.needRegister) {
              my.redirectTo({ url: '/pages/guide/index/index' });
            } else {
              saveTokens(res.accessToken, res.refreshToken);
              const app = getApp();
              app.globalData.accessToken = res.accessToken;
              app.globalData.studentId = res.userId;
              app.globalData.studentProfile = {
                name: res.name,
                phone: res.phone,
                realnameStatus: res.realnameStatus,
              };
              if (res.realnameStatus !== 'VERIFIED') {
                my.redirectTo({ url: '/pages/auth/realname/index' });
              } else {
                my.switchTab({ url: '/pages/index/index/index' });
              }
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
