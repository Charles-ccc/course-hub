const { request } = require('../../../services/request');

function formatDuration(sec) {
  if (!sec || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const HOME_STATUS_MAP = {
  CREATED:    { text: '待签约', cls: 'tag-orange' },
  ACTIVE:     { text: '进行中', cls: 'tag-green' },
  COMPLETED:  { text: '已完成', cls: 'tag-grey' },
  REFUNDED:   { text: '已退款', cls: 'tag-grey' },
  TERMINATED: { text: '已终止', cls: 'tag-grey' },
};

Page({
  data: {
    // 'home' = TabBar 入口，'course' = 带 courseId 的深链
    mode: 'home',
    loading: true,

    // home 模式
    orders: [],

    // course 模式
    courseId: '',
    isTrial: false,
    course: null,
    videos: [],
  },

  onLoad(query) {
    const courseId = (query && query.courseId) || '';
    if (courseId) {
      const isTrial = query.trial === '1';
      this.setData({ mode: 'course', courseId, isTrial });
      this._fetchCourse(courseId, isTrial);
    } else {
      this.setData({ mode: 'home' });
      this._fetchOrders();
    }
  },

  onShow() {
    // 从深链返回 home 时刷新列表
    if (this.data.mode === 'home' && !this.data.loading) {
      this._fetchOrders();
    }
  },

  // ── home 模式 ──────────────────────────────
  _fetchOrders() {
    this.setData({ loading: true });
    request({ url: '/orders', method: 'GET' })
      .then((list) => {
        const orders = (list || []).map((o) => {
          const s = HOME_STATUS_MAP[o.status] || { text: o.status, cls: 'tag-grey' };
          return {
            id: o.id,
            courseId: o.courseId,
            courseName: o.courseName,
            insitutionName: o.insitutionName,
            totalYuan: formatYuan(o.totalAmountCents),
            createdAt: formatDate(o.createdAt),
            statusText: s.text,
            statusCls: s.cls,
            canLearn: o.status === 'ACTIVE',
            canSign: o.status === 'CREATED',
          };
        });
        this.setData({ orders, loading: false });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  onTapOrder(e) {
    const id = e.currentTarget.dataset.id;
    my.navigateTo({ url: `/pages/order/detail/index?orderId=${id}` });
  },

  onLearnCourse(e) {
    const courseId = e.currentTarget.dataset.courseId;
    if (!courseId) return;
    my.navigateTo({
      url: `/pages/learning/index/index?courseId=${courseId}`,
    });
  },

  onGoDiscover() {
    my.switchTab({ url: '/pages/index/index/index' });
  },

  // ── course 模式 ────────────────────────────
  _fetchCourse(courseId, isTrial) {
    this.setData({ loading: true });
    Promise.all([
      request({ url: `/courses/${courseId}`, method: 'GET', noAuth: true }),
      request({ url: `/courses/${courseId}/videos`, method: 'GET', noAuth: true }),
    ])
      .then(([course, rawVideos]) => {
        const videos = (rawVideos || []).map((v) => ({
          id: v.id,
          title: v.title,
          durationStr: formatDuration(v.durationSec),
          isTrial: v.isTrial,
          sortOrder: v.sortOrder,
          locked: isTrial && !v.isTrial,
        }));
        this.setData({ course, videos, loading: false });
      })
      .catch((err) => {
        this.setData({ loading: false });
        my.showToast({ content: (err && err.message) || '加载失败', type: 'fail' });
      });
  },

  onTapVideo(e) {
    const locked = e.currentTarget.dataset.locked;
    if (locked) {
      my.showToast({ content: '购课后可解锁全部章节', type: 'none' });
      return;
    }
    my.showToast({ content: '视频功能即将上线，敬请期待', type: 'none' });
  },

  onEnroll() {
    my.navigateTo({
      url: `/pages/course/detail/index?courseId=${this.data.courseId}`,
    });
  },
});
