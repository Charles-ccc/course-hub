const { request, saveTokens } = require('../../../services/request');

Page({
  data: {
    loading: false,
  },

  onLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    my.getAuthCode({
      scopes: 'auth_base',
      success: (authRes) => {
        console.log('[login] authCode:', authRes.authCode);
        request({
          url: '/auth/alipay/login',
          method: 'POST',
          data: { authCode: authRes.authCode },
          noAuth: true,
        })
          .then((res) => {
            console.log('[login] /auth/alipay/login response:', res);

            if (res.needRegister) {
              console.log('[login] 新用户，跳引导页注册');
              this.setData({ loading: false });
              my.redirectTo({ url: '/pages/guide/index/index' });
              return;
            }

            // 已注册 → 保存 token + 进首页
            const profile = {
              userId: res.userId,
              name: res.name,
              phone: res.phone,
              realnameStatus: res.realnameStatus,
            };
            console.log('[login] 已注册用户 profile:', profile);
            console.log('[login] accessToken:', res.accessToken);
            console.log('[login] refreshToken:', res.refreshToken);

            saveTokens(res.accessToken, res.refreshToken);
            const app = getApp();
            app.globalData.accessToken = res.accessToken;
            app.globalData.studentId = res.userId;
            app.globalData.studentProfile = {
              name: res.name,
              phone: res.phone,
              realnameStatus: res.realnameStatus,
            };
            my.reLaunch({ url: '/pages/index/index/index' });
          })
          .catch((err) => {
            this.setData({ loading: false });
            const msg = (err && err.message) || '登录失败，请重试';
            my.showToast({ content: msg, type: 'fail' });
          });
      },
      fail: () => {
        this.setData({ loading: false });
        my.showToast({ content: '需要支付宝授权才能登录', type: 'fail' });
      },
    });
  },
});
