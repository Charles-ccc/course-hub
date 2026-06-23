Page({
  data: {
    url: '',
    certifyId: '',
  },

  onLoad(query) {
    const url = decodeURIComponent(query.url || '');
    const certifyId = query.certifyId || '';
    this.setData({ url, certifyId });
  },

  // 页面 unload 时（用户从 web-view 返回小程序），主动触发查询
  onUnload() {
    const pages = getCurrentPages();
    const prev = pages[pages.length - 1];
    if (prev && prev.route && prev.route.indexOf('auth/realname') >= 0 && prev._doConfirm) {
      // 通知上一个页面去查 certify 结果
      prev._certifyId = this.data.certifyId;
      prev._doConfirm();
    }
  },

  onWebMessage(_e) {
    // web-view 内 my.postMessage 时触发，暂不依赖
  },
});
