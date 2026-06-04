export default defineAppConfig({
  pages: [
    "pages/gate/index", // ← 首页：无来源时拦截
    "pages/index/index", // ← tabBar 首页（有来源后可见）
    "pages/auth/login",
    "pages/auth/realname",
    "pages/course/list",
    "pages/course/detail",
    "pages/order/create",
    "pages/order/list",
    "pages/order/detail",
    "pages/learning/index",
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
        pagePath: "pages/order/list",
        text: "我的课程",
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
