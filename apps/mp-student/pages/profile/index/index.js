const { request, clearTokens, STORAGE_KEY } = require('../../../services/request');
const app = getApp();

const REALNAME_MAP = {
  VERIFIED: { verified: true, badge: '✓ 已实名', entryText: '' },
  UNVERIFIED: { verified: false, badge: '', entryText: '完成实名认证' },
  REJECTED: { verified: false, badge: '', entryText: '实名认证未通过，重新认证' },
};

Page({
  data: {
    loggedIn: false,
    initial: '',
    name: '',
    phone: '',
    realnameVerified: false,
    realnameBadge: '',
    realnameEntryText: '',
    loading: false,
  },

  onShow() {
    if (!this._hasToken()) {
      this.setData({ loggedIn: false });
      return;
    }
    this.setData({ loggedIn: true });
    const profile = app.globalData.studentProfile;
    if (profile) {
      this._applyProfile(profile);
    } else {
      this._fetchProfile();
    }
  },

  _hasToken() {
    try {
      return !!my.getStorageSync({ key: STORAGE_KEY.ACCESS_TOKEN }).data;
    } catch (e) {
      return false;
    }
  },

  _applyProfile(profile) {
    const name = profile.name || profile.phone || '';
    const rn = REALNAME_MAP[profile.realnameStatus] || REALNAME_MAP.UNVERIFIED;
    this.setData({
      name,
      phone: profile.phone || '',
      initial: name ? name.charAt(0) : '我',
      realnameVerified: rn.verified,
      realnameBadge: rn.badge,
      realnameEntryText: rn.entryText,
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

  onGoRealname() {
    my.navigateTo({ url: '/pages/auth/realname/index' });
  },

  onGoOrders() {
    my.navigateTo({ url: '/pages/order/list/index' });
  },

  onGoLogin() {
    my.reLaunch({ url: '/pages/auth/login/index' });
  },

  onLogout() {
    my.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      success: (res) => {
        if (res.confirm) {
          clearTokens();
          app.globalData.accessToken = null;
          app.globalData.studentProfile = null;
          my.reLaunch({ url: '/pages/auth/login/index' });
        }
      },
    });
  },
});
