function formatYuan(cents) {
  if (typeof cents !== 'number') return '0';
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

Component({
  props: {
    course: null,
    onTap: () => {},
  },

  data: {
    priceTotal: '0',
    segmentCount: 0,
  },

  didMount() {
    this.recompute(this.props.course);
  },

  didUpdate(prevProps) {
    if (prevProps.course !== this.props.course) {
      this.recompute(this.props.course);
    }
  },

  methods: {
    recompute(course) {
      if (!course) return;
      const periods = course.periodCount || 1;
      this.setData({
        priceTotal: formatYuan(course.priceCents),
        segmentCount: periods > 1 ? periods : 0,
      });
    },

    onTap() {
      if (typeof this.props.onTap === 'function') {
        this.props.onTap(this.props.course);
      }
    },
  },
});
