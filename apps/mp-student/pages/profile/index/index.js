const { request } = require('../../../services/request');
const app = getApp();

Page({
  data: {
    initial: '',
    name: '',
    phone: '',
    loading: false,
  },

  onShow() {
    const profile = app.globalData.studentProfile;
    if (profile) {
      this._applyProfile(profile);
    } else {
      this._fetchProfile();
    }
  },

  _applyProfile(profile) {
    const name = profile.name || profile.phone || '';
    this.setData({
      name,
      phone: profile.phone || '',
      initial: name ? name.charAt(0) : '我',
      loading: false,
    });
  },

  _fetchProfile() {
    this.setData({ loading: true });
    request({ url: '/users/me', method: 'GET' })
      .then((profile) => {
        app.globalData.studentProfile = profile;
        this._applyProfile(profile);
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  onGoOrders() {
    my.navigateTo({ url: '/pages/order/list/index' });
  },

  onLogout() {
    my.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      success: (res) => {
        if (res.confirm) {
          my.removeStorageSync({ key: 'accessToken' });
          my.removeStorageSync({ key: 'refreshToken' });
          app.globalData.accessToken = null;
          app.globalData.studentProfile = null;
          my.reLaunch({ url: '/pages/auth/login/index' });
        }
      },
    });
  },
});
