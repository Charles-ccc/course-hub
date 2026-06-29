const { request } = require('../../../services/request');

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// 客户端计算扣款计划（与后端 buildInstallments 一致：均分、末段吸收余数、每段 +30 天）
function computePlan(priceCents, periodCount) {
  const rows = [];
  const base = Math.floor(priceCents / periodCount);
  let allocated = 0;
  const now = new Date();
  for (let k = 1; k <= periodCount; k++) {
    const isLast = k === periodCount;
    const cents = isLast ? priceCents - allocated : base;
    allocated += cents;
    const d = new Date(now.getTime() + k * 30 * 24 * 60 * 60 * 1000);
    rows.push({
      periodNo: k,
      dateStr: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
      amountYuan: formatYuan(cents),
    });
  }
  return rows;
}

Page({
  data: {
    courseId: '',
    course: null,
    loading: true,
    priceTotal: '0',
    segmentCount: 0,
    planRows: [],
    showPlanModal: false,
    showNoticeModal: false,
  },

  _enrollConfirmed: false,

  onLoad(query) {
    const courseId = (query && query.courseId) || '';
    if (!courseId) {
      my.showToast({ content: '课程参数缺失', type: 'fail' });
      return;
    }
    this.setData({ courseId, loading: true });
    this._fetch(courseId);
  },

  onShowPlan() {
    this.setData({ showPlanModal: true });
  },

  onClosePlan() {
    this.setData({ showPlanModal: false });
  },

  onTrialLearn() {
    if (!this.data.courseId) return;
    my.navigateTo({
      url: `/pages/learning/index/index?courseId=${this.data.courseId}&trial=1`,
    });
  },

  onEnroll() {
    if (!this.data.course) return;
    if (this._enrollConfirmed) {
      this._goConfirm();
    } else {
      this.setData({ showNoticeModal: true });
    }
  },

  onCancelNotice() {
    this.setData({ showNoticeModal: false });
  },

  onConfirmNotice() {
    this._enrollConfirmed = true;
    this.setData({ showNoticeModal: false });
    this._goConfirm();
  },

  noop() {},

  _goConfirm() {
    my.navigateTo({
      url: `/pages/order/confirm/index?courseId=${this.data.courseId}`,
    });
  },

  _fetch(courseId) {
    request({
      url: `/courses/${courseId}`,
      method: 'GET',
      noAuth: true,
    })
      .then((course) => {
        const periods = course.periodCount || 1;
        this.setData({
          course,
          loading: false,
          priceTotal: formatYuan(course.priceCents),
          segmentCount: periods > 1 ? periods : 0,
          planRows: periods > 1 ? computePlan(course.priceCents, periods) : [],
        });
      })
      .catch((err) => {
        this.setData({ loading: false, course: null });
        const msg = (err && err.message) || '加载失败';
        my.showToast({ content: msg, type: 'fail' });
      });
  },
});
