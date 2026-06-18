const { request } = require('../../../services/request');

Page({
  data: {
    status: 'UNVERIFIED', // UNVERIFIED | VERIFIED | REJECTED
    certifying: false,
  },

  _certifyId: null,

  onLoad() {
    const app = getApp();
    const profile = app.globalData.studentProfile;
    const status = (profile && profile.realnameStatus) || 'UNVERIFIED';
    this.setData({ status });
  },

  onStartCertify() {
    if (this.data.certifying) return;
    this.setData({ certifying: true });

    request({ url: '/users/realname/initialize', method: 'POST' })
      .then((res) => {
        this._certifyId = res.certifyId;

        // 小程序-生物核身：使用 my.startAPVerify JSAPI
        my.startAPVerify({
          certifyId: res.certifyId,
          success: () => {
            this._doConfirm();
          },
          fail: (err) => {
            this.setData({ certifying: false });
            const msg = (err && (err.errorMessage || err.error)) || '认证失败，请重试';
            my.showToast({ content: String(msg), type: 'fail' });
          },
        });
      })
      .catch((err) => {
        this.setData({ certifying: false });
        const msg = (err && err.message) || '认证初始化失败，请重试';
        my.showToast({ content: msg, type: 'fail' });
      });
  },

  _doConfirm() {
    const certifyId = this._certifyId;
    this._certifyId = null;

    request({
      url: '/users/realname/confirm',
      method: 'POST',
      data: { certifyId },
    })
      .then((res) => {
        this.setData({ certifying: false, status: res.realnameStatus });

        const app = getApp();
        if (app.globalData.studentProfile) {
          app.globalData.studentProfile.realnameStatus = res.realnameStatus;
          if (res.name) app.globalData.studentProfile.name = res.name;
        }

        if (res.realnameStatus === 'VERIFIED') {
          my.showToast({ content: '实名认证成功', type: 'success' });
          setTimeout(() => {
            my.switchTab({ url: '/pages/index/index/index' });
          }, 1500);
        } else {
          my.showToast({ content: '认证未通过，请重新提交', type: 'fail' });
        }
      })
      .catch((err) => {
        this._certifyId = null;
        this.setData({ certifying: false });
        const msg = (err && err.message) || '认证结果查询失败，请重试';
        my.showToast({ content: msg, type: 'fail' });
      });
  },

  onGoHome() {
    my.switchTab({ url: '/pages/index/index/index' });
  },
});
