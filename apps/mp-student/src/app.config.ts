export default defineAppConfig({
  pages: [
    "pages/gate/index",    // ← 启动路由（检查登录状态）
    "pages/index/index",
    "pages/auth/login",
    "pages/auth/register",
    "pages/auth/forgot",
    "pages/auth/realname",
    "pages/course/list",
    "pages/course/detail",
    "pages/order/create",
    "pages/order/list",
    "pages/order/detail",
    "pages/learning/index",
    "pages/learning/player",
    "pages/learning/teacher",
    "pages/learning/checkin",
    "pages/profile/index",
    "pages/profile/referral",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#2563eb",
    navigationBarTitleText: "网课超市",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    color: "#7b8493",
    selectedColor: "#2563eb",
    backgroundColor: "#fbfcff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "assets/tab-home.png",
        selectedIconPath: "assets/tab-home-active.png",
      },
      {
        pagePath: "pages/learning/index",
        text: "学习",
        iconPath: "assets/tab-course.png",
        selectedIconPath: "assets/tab-course-active.png",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/tab-profile.png",
        selectedIconPath: "assets/tab-profile-active.png",
      },
    ],
  },
});
