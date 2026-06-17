const { request, saveTokens, STORAGE_KEY } = require("./services/request");

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

    this._silentLogin();
  },

  _silentLogin() {
    my.getAuthCode({
      scopes: "auth_base",
      success: (loginResult) => {
        const authCode = loginResult.authCode;
        request({
          url: "/auth/alipay/login",
          method: "POST",
          data: { authCode },
          noAuth: true,
        })
          .then((res) => {
            if (res.needRegister) {
              my.redirectTo({ url: "/pages/guide/index/index" });
            } else {
              saveTokens(res.accessToken, res.refreshToken);
              this.globalData.accessToken = res.accessToken;
              this.globalData.studentId = res.userId;
              this.globalData.studentProfile = {
                name: res.name,
                phone: res.phone,
                realnameStatus: res.realnameStatus,
              };
              // 已登录，留在首页（TabBar 默认第一项）
            }
          })
          .catch(() => {
            // 网络异常或后端未配置时跳引导页
            my.redirectTo({ url: "/pages/guide/index/index" });
          });
      },
      fail() {
        my.redirectTo({ url: "/pages/guide/index/index" });
      },
    });
  },
});
