const { STORAGE_KEY } = require('../../../services/request');

Page({
  onLoad() {
    // 仅根据本地是否有 accessToken 决定路由，不再做静默登录
    let hasToken = false;
    try {
      hasToken = !!my.getStorageSync({ key: STORAGE_KEY.ACCESS_TOKEN }).data;
    } catch (e) {
      hasToken = false;
    }

    if (hasToken) {
      my.switchTab({ url: '/pages/index/index/index' });
    } else {
      my.redirectTo({ url: '/pages/auth/login/index' });
    }
  },
});
