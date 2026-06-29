const { request } = require('../../../services/request');

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

const STATUS_MAP = {
  CREATED:    { text: '待处理', cls: 'tag-orange' },
  ACTIVE:     { text: '进行中', cls: 'tag-green' },
  COMPLETED:  { text: '已完成', cls: 'tag-grey' },
  REFUNDED:   { text: '已退款', cls: 'tag-grey' },
  TERMINATED: { text: '已终止', cls: 'tag-grey' },
};

Page({
  data: {
    orders: [],
    loading: true,
  },

  onLoad() {
    this._fetch();
  },

  onShow() {
    // 从详情页返回后刷新列表
    if (!this.data.loading) {
      this._fetch();
    }
  },

  _fetch() {
    this.setData({ loading: true });
    request({ url: '/orders', method: 'GET' })
      .then((list) => {
        const orders = (list || []).map((o) => {
          const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-grey' };
          const isDeferred = o.payType === 'DEFERRED';
          // CREATED 按付款方式区分文案
          const statusText =
            o.status === 'CREATED' ? (isDeferred ? '待履约' : '待支付') : s.text;
          const overdueCount = o.overdueCount || 0;
          return {
            id: o.id,
            courseName: o.courseName,
            insitutionName: o.insitutionName,
            totalYuan: formatYuan(o.totalAmountCents),
            payLabel: isDeferred ? `先学后付 · 分${o.periodCount}段` : '课程报名',
            createdAt: formatDate(o.createdAt),
            statusText,
            statusCls: s.cls,
            hasOverdue: overdueCount > 0,
            overdueCount,
            overdueYuan: formatYuan(o.overdueAmountCents || 0),
          };
        });
        this.setData({ orders, loading: false });
      })
      .catch((err) => {
        this.setData({ loading: false });
        my.showToast({ content: (err && err.message) || '加载失败', type: 'fail' });
      });
  },

  onTapOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    my.navigateTo({ url: `/pages/order/detail/index?orderId=${orderId}` });
  },

  onGoHome() {
    my.switchTab({ url: '/pages/index/index/index' });
  },
});
