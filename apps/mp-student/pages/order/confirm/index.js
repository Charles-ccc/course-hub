const { request } = require('../../../services/request');

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

Page({
  data: {
    courseId: '',
    payType: 'IMMEDIATE',
    course: null,
    loading: true,
    submitting: false,
    pricePerPeriod: '0',
    priceTotal: '0',
    payTitle: '',
    payDesc: '',
    btnText: '',
  },

  onLoad(query) {
    const courseId = (query && query.courseId) || '';
    const payType = (query && query.payType) === 'DEFERRED' ? 'DEFERRED' : 'IMMEDIATE';
    if (!courseId) {
      my.showToast({ content: '课程参数缺失', type: 'fail' });
      return;
    }

    const isDeferred = payType === 'DEFERRED';
    this.setData({
      courseId,
      payType,
      loading: true,
      payTitle: isDeferred ? '先学后付' : '立即付款',
      payDesc: isDeferred
        ? '每期课程结束后再扣款，无需预付'
        : '一次性付款，立即开始学习',
      btnText: isDeferred ? '确认并签约' : '确认付款',
    });
    this._fetch(courseId);
  },

  _fetch(courseId) {
    request({ url: `/courses/${courseId}`, method: 'GET', noAuth: true })
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
        my.showToast({ content: (err && err.message) || '加载失败', type: 'fail' });
      });
  },

  onConfirm() {
    if (this.data.submitting || !this.data.course) return;
    this.setData({ submitting: true });

    request({
      url: '/orders',
      method: 'POST',
      data: { courseId: this.data.courseId, payType: this.data.payType },
    })
      .then((res) => {
        my.showToast({ content: '报名成功', type: 'success' });
        setTimeout(() => {
          my.redirectTo({ url: `/pages/order/detail/index?orderId=${res.orderId}` });
        }, 1500);
      })
      .catch((err) => {
        this.setData({ submitting: false });
        my.showToast({ content: (err && err.message) || '下单失败，请重试', type: 'fail' });
      });
  },
});
