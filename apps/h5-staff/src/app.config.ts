export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/auth/login",
    "pages/students/list",
    "pages/commission/index",
    "pages/profile/index",
  ],
  window: {
    navigationBarBackgroundColor: "#0f766e",
    navigationBarTitleText: "网课超市·业务员",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    color: "#7b8493",
    selectedColor: "#0f766e",
    backgroundColor: "#fbfcfb",
    list: [
      { pagePath: "pages/index/index", text: "首页" },
      { pagePath: "pages/profile/index", text: "我的" },
    ],
  },
});
