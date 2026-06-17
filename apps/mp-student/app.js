App({
  globalData: {
    accessToken: null,
    studentId: null,
    studentProfile: null,
  },

  onLaunch(options) {
    // 捕获归因参数（业务员码 / 学员邀请链接）
    const query = options.query || {};
    if (query.staffId) {
      my.setStorageSync({ key: "attributionStaffId", data: query.staffId });
    }
    if (query.studentId) {
      my.setStorageSync({ key: "attributionStudentId", data: query.studentId });
    }
    // 登录判断在 pages/splash/index/index.js onLoad 中处理
  },
});
