const { request, saveTokens } = require('../../../services/request');

Page({
  data: {
    orgCode: '',
    orgInfo: null,
    validating: false,
    registering: false,
  },

  onOrgCodeInput(e) {
    this.setData({ orgCode: e.detail.value, orgInfo: null });
  },

  onValidate() {
    const orgCode = this.data.orgCode.trim();
    if (!orgCode) {
      my.showToast({ content: '请输入机构码', type: 'fail' });
      return;
    }

    this.setData({ validating: true });

    my.getAuthCode({
      scopes: 'auth_base',
      success: (loginRes) => {
        request({
          url: '/auth/org-code/validate',
          method: 'POST',
          data: { authCode: loginRes.authCode, orgCode },
          noAuth: true,
        })
          .then((res) => {
            this.setData({ orgInfo: res, validating: false });
          })
          .catch((err) => {
            this.setData({ validating: false });
            const msg = (err && err.message) || '机构码无效，请联系招生老师确认';
            my.showToast({ content: msg, type: 'fail' });
          });
      },
      fail: () => {
        this.setData({ validating: false });
        my.showToast({ content: '获取授权码失败，请重试', type: 'fail' });
      },
    });
  },

  onGetAuthorize() {
    my.getPhoneNumber({
      success: (res) => {
        const encryptedData = res.response;
        my.getAuthCode({
          scopes: 'auth_base',
          success: (loginRes) => {
            this._doRegister(loginRes.authCode, encryptedData);
          },
          fail: () => {
            my.showToast({ content: '获取授权码失败，请重试', type: 'fail' });
          },
        });
      },
      fail: () => {
        my.showToast({ content: '需要授权手机号才能注册', type: 'fail' });
      },
    });
  },

  onAuthError() {
    my.showToast({ content: '需要授权才能完成注册', type: 'fail' });
  },

  _doRegister(authCode, encryptedData) {
    const orgCode = this.data.orgCode.trim();
    this.setData({ registering: true });

    request({
      url: '/auth/alipay/register',
      method: 'POST',
      data: { authCode, encryptedData, orgCode },
      noAuth: true,
    })
      .then((res) => {
        saveTokens(res.accessToken, res.refreshToken);
        const app = getApp();
        app.globalData.accessToken = res.accessToken;
        app.globalData.studentId = res.userId;
        app.globalData.studentProfile = {
          name: res.name,
          phone: res.phone,
          realnameStatus: res.realnameStatus,
        };
        my.redirectTo({ url: '/pages/auth/realname/index' });
      })
      .catch((err) => {
        this.setData({ registering: false });
        const msg = (err && err.message) || '注册失败，请重试';
        my.showToast({ content: msg, type: 'fail' });
      });
  },
});
