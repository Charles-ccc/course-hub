const { request } = require('../../../services/request');

Page({
  data: {
    status: 'UNVERIFIED', // UNVERIFIED | VERIFIED | REJECTED
    certifying: false,
    name: '',
    idCardNo: '',
  },

  _certifyId: null,

  onLoad() {
    const app = getApp();
    const profile = app.globalData.studentProfile;
    const status = (profile && profile.realnameStatus) || 'UNVERIFIED';
    this.setData({ status });
  },

  onNameInput(e) {
    this.setData({ name: (e.detail.value || '').trim() });
  },

  onIdCardInput(e) {
    this.setData({ idCardNo: (e.detail.value || '').trim().toUpperCase() });
  },

  onStartCertify() {
    if (this.data.certifying) return;

    const { name, idCardNo } = this.data;
    if (!name) {
      my.showToast({ content: '请输入姓名', type: 'fail' });
      return;
    }
    if (!/^\d{17}[\dX]$/.test(idCardNo)) {
      my.showToast({ content: '请输入正确的18位身份证号', type: 'fail' });
      return;
    }

    this.setData({ certifying: true });

    request({
      url: '/users/realname/initialize',
      method: 'POST',
      data: { name, idCardNo },
    })
      .then((res) => {
        this._certifyId = res.certifyId;
        const certifyUrl = res.certifyUrl || '';
        this.setData({ certifying: false });

        if (!certifyUrl) {
          my.showToast({ content: '认证地址缺失', type: 'fail' });
          return;
        }

        my.navigateTo({
          url: '/pages/auth/realname-webview/index?url=' +
            encodeURIComponent(certifyUrl) +
            '&certifyId=' + encodeURIComponent(res.certifyId),
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
            my.reLaunch({ url: '/pages/index/index/index' });
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
    my.reLaunch({ url: '/pages/index/index/index' });
  },
});
