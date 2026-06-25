const app = getApp();

Page({
  data: {
    initial: '',
    name: '',
    phone: '',
  },

  onShow() {
    const profile = app.globalData.studentProfile;
    if (profile) {
      const name = profile.name || profile.phone || '';
      this.setData({
        name,
        phone: profile.phone || '',
        initial: name ? name.charAt(0).toUpperCase() : '我',
      });
    }
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
