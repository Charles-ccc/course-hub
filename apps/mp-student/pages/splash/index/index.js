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
      // reLaunch 而非 switchTab：清空页面栈，首页成为唯一根页面，避免 splash 残留导致返回箭头
      my.reLaunch({ url: '/pages/index/index/index' });
    } else {
      my.redirectTo({ url: '/pages/auth/login/index' });
    }
  },
});
