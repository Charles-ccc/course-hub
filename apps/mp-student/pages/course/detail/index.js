const { request } = require('../../../services/request');

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

Page({
  data: {
    courseId: '',
    course: null,
    loading: true,
    payType: 'IMMEDIATE',
    pricePerPeriod: '0',
    priceTotal: '0',
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

  onPayTypeChange(e) {
    const payType = e.currentTarget.dataset.pay;
    if (payType) this.setData({ payType });
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
      url: `/pages/order/confirm/index?courseId=${this.data.courseId}&payType=${this.data.payType}`,
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
          pricePerPeriod: formatYuan(Math.round(course.priceCents / periods)),
          priceTotal: formatYuan(course.priceCents),
        });
      })
      .catch((err) => {
        this.setData({ loading: false, course: null });
        const msg = (err && err.message) || '加载失败';
        my.showToast({ content: msg, type: 'fail' });
      });
  },
});
