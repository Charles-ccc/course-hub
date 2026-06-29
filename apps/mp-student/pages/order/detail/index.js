const { request } = require('../../../services/request');

function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const ORDER_STATUS_MAP = {
  CREATED: { text: '待授权', cls: 'status-created' },
  ACTIVE: { text: '进行中', cls: 'status-active' },
  COMPLETED: { text: '已完成', cls: 'status-done' },
  REFUNDED: { text: '已退款', cls: 'status-done' },
  TERMINATED: { text: '已终止', cls: 'status-done' },
};

const PERIOD_STATUS_MAP = {
  PENDING: '待扣款',
  DELIVERED: '已开课',
  PAID: '已扣款',
  OVERDUE: '已逾期',
  WRITTEN_OFF: '已核销',
};

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    isDeferred: false,
    payTitle: '',
    totalYuan: '0',
    statusText: '',
    statusCls: '',
    installments: [],
    canZhima: false,
    canPay: false,
    canLearn: false,
    hasOverdue: false,
  },

  // 标记是否刚从芝麻先享页返回，用于 onShow 触发 confirm
  _zhimaPending: false,

  onLoad(query) {
    const orderId = (query && query.orderId) || '';
    if (!orderId) {
      my.showToast({ content: '订单参数缺失', type: 'fail' });
      return;
    }
    this.setData({ orderId, loading: true });
    this._fetch(orderId);
  },

  onShow() {
    if (this._zhimaPending && this.data.orderId) {
      this._zhimaPending = false;
      this._zhimaConfirm(this.data.orderId);
    }
  },

  _fetch(orderId) {
    request({ url: `/orders/${orderId}`, method: 'GET' })
      .then((order) => {
        const statusInfo = ORDER_STATUS_MAP[order.status] || {
          text: order.status,
          cls: 'status-created',
        };
        const installments = (order.installments || []).map((it) => ({
          periodNo: it.periodNo,
          dueDate: formatDate(it.dueDate),
          amountYuan: formatYuan(it.plannedAmountCents),
          statusText: PERIOD_STATUS_MAP[it.status] || it.status,
          isOverdue: it.status === 'OVERDUE',
        }));
        const isDeferred = order.payType === 'DEFERRED';
        const hasOverdue = installments.some((it) => it.isOverdue);
        this.setData({
          order,
          loading: false,
          isDeferred,
          payTitle: isDeferred ? '先学后付' : '立即付款',
          totalYuan: formatYuan(order.totalAmountCents),
          statusText: statusInfo.text,
          statusCls: statusInfo.cls,
          installments,
          canZhima: order.status === 'CREATED' && isDeferred,
          canPay: order.status === 'CREATED' && !isDeferred,
          canLearn: order.status === 'ACTIVE',
          hasOverdue,
        });
      })
      .catch((err) => {
        this.setData({ loading: false, order: null });
        my.showToast({ content: (err && err.message) || '加载失败', type: 'fail' });
      });
  },

  onZhima() {
    const { orderId } = this.data;
    my.showLoading({ content: '准备授权...' });
    request({ url: `/orders/${orderId}/zhima/initialize`, method: 'POST' })
      .then((res) => {
        my.hideLoading();
        const scheme = res && res.scheme;
        if (!scheme) {
          my.showToast({ content: '获取授权链接失败', type: 'fail' });
          return;
        }
        this._zhimaPending = true;
        my.ap.navigateToAlipayPage({ path: scheme });
      })
      .catch((err) => {
        my.hideLoading();
        my.showToast({ content: (err && err.message) || '发起授权失败', type: 'fail' });
      });
  },

  _zhimaConfirm(orderId) {
    request({ url: `/orders/${orderId}/zhima/confirm`, method: 'POST' })
      .then((res) => {
        if (res && res.orderStatus === 'ACTIVE') {
          my.showToast({ content: '授权成功，课程已解锁！', type: 'success' });
          this._fetch(orderId);
        } else {
          // 用户未完成授权，静默忽略
        }
      })
      .catch(() => {
        // 未完成授权不显示错误，用户可再次点击按钮重试
      });
  },

  onPay() {
    const { orderId } = this.data;
    my.showLoading({ content: '发起支付...' });
    request({ url: `/orders/${orderId}/pay`, method: 'POST' })
      .then((res) => {
        my.hideLoading();
        const tradeNo = res && res.tradeNo;
        if (!tradeNo) {
          my.showToast({ content: '创建支付单失败', type: 'fail' });
          return;
        }
        my.tradePay({
          tradeNO: tradeNo,
          success: () => {
            this._payConfirm(orderId);
          },
          fail: () => {
            my.showToast({ content: '支付已取消', type: 'none' });
          },
        });
      })
      .catch((err) => {
        my.hideLoading();
        my.showToast({ content: (err && err.message) || '发起支付失败', type: 'fail' });
      });
  },

  _payConfirm(orderId) {
    request({ url: `/orders/${orderId}/pay/confirm`, method: 'POST' })
      .then((res) => {
        if (res && res.orderStatus === 'ACTIVE') {
          my.showToast({ content: '支付成功，课程已解锁！', type: 'success' });
        }
        this._fetch(orderId);
      })
      .catch(() => {
        // 确认失败时（如回调延迟）刷新订单，状态以 notify 为准
        this._fetch(orderId);
      });
  },

  onRepay(e) {
    const periodNo = e.currentTarget.dataset.periodNo;
    const { orderId } = this.data;
    my.showLoading({ content: '创建支付单...' });
    request({
      url: `/orders/${orderId}/installments/${periodNo}/repay`,
      method: 'POST',
    })
      .then((res) => {
        my.hideLoading();
        const tradeNo = res && res.tradeNo;
        if (!tradeNo) {
          my.showToast({ content: '创建支付单失败', type: 'fail' });
          return;
        }
        my.tradePay({
          tradeNO: tradeNo,
          success: () => {
            my.showToast({ content: '还款成功', type: 'success' });
            this._fetch(orderId);
          },
          fail: () => {
            my.showToast({ content: '还款取消或失败', type: 'none' });
          },
        });
      })
      .catch((err) => {
        my.hideLoading();
        my.showToast({ content: (err && err.message) || '还款失败', type: 'fail' });
      });
  },

  onLearn() {
    if (this.data.order && this.data.order.courseId) {
      my.navigateTo({
        url: `/pages/learning/index/index?courseId=${this.data.order.courseId}`,
      });
    }
  },

  onViewCourse() {
    if (this.data.order && this.data.order.courseId) {
      my.navigateTo({
        url: `/pages/course/detail/index?courseId=${this.data.order.courseId}`,
      });
    }
  },
});
