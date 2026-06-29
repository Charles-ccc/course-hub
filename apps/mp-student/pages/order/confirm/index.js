const { request } = require('../../../services/request');

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// 客户端计算扣款计划（与后端 buildInstallments 一致）
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
    payType: 'IMMEDIATE',
    course: null,
    loading: true,
    submitting: false,
    isDeferred: false,
    priceTotal: '0',
    segmentCount: 0,
    planRows: [],
  },

  onLoad(query) {
    const courseId = (query && query.courseId) || '';
    const payType = (query && query.payType) === 'DEFERRED' ? 'DEFERRED' : 'IMMEDIATE';
    if (!courseId) {
      my.showToast({ content: '课程参数缺失', type: 'fail' });
      return;
    }
    this.setData({
      courseId,
      payType,
      isDeferred: payType === 'DEFERRED',
      loading: true,
    });
    this._fetch(courseId);
  },

  _fetch(courseId) {
    request({ url: `/courses/${courseId}`, method: 'GET', noAuth: true })
      .then((course) => {
        const periods = course.periodCount || 1;
        const isDeferred = this.data.payType === 'DEFERRED';
        this.setData({
          course,
          loading: false,
          priceTotal: formatYuan(course.priceCents),
          segmentCount: periods > 1 ? periods : 0,
          planRows: isDeferred && periods > 1 ? computePlan(course.priceCents, periods) : [],
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
        my.showToast({ content: (err && err.message) || '报名失败，请重试', type: 'fail' });
      });
  },
});
