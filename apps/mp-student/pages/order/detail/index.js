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
  CREATED: { text: '待签约', cls: 'status-created' },
  COOLING_OFF: { text: '冷静期', cls: 'status-created' },
  ACTIVE: { text: '进行中', cls: 'status-active' },
  COMPLETED: { text: '已完成', cls: 'status-done' },
  REFUNDED: { text: '已退款', cls: 'status-done' },
  TERMINATED: { text: '已终止', cls: 'status-done' },
};

const PERIOD_STATUS_MAP = {
  PENDING: '待开课',
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
    canSign: false,
    canLearn: false,
  },

  onLoad(query) {
    const orderId = (query && query.orderId) || '';
    if (!orderId) {
      my.showToast({ content: '订单参数缺失', type: 'fail' });
      return;
    }
    this.setData({ orderId, loading: true });
    this._fetch(orderId);
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
        }));
        const isDeferred = order.payType === 'DEFERRED';
        this.setData({
          order,
          loading: false,
          isDeferred,
          payTitle: isDeferred ? '先学后付' : '立即付款',
          totalYuan: formatYuan(order.totalAmountCents),
          statusText: statusInfo.text,
          statusCls: statusInfo.cls,
          installments,
          canSign: order.status === 'CREATED',
          canLearn: order.status === 'ACTIVE',
        });
      })
      .catch((err) => {
        this.setData({ loading: false, order: null });
        my.showToast({ content: (err && err.message) || '加载失败', type: 'fail' });
      });
  },

  onSign() {
    my.showToast({ content: '签约功能即将上线，敬请期待', type: 'none' });
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
