const { request } = require('../../../services/request');

Page({
  data: {
    keyword: '',
    activeKeyword: '',
    courses: [],
    page: 1,
    pageSize: 20,
    hasNext: true,
    loading: false,
    loadingMore: false,
  },

  onLoad() {
    this._loadFirstPage();
  },

  onPullDownRefresh() {
    this._loadFirstPage().then(() => my.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasNext && !this.data.loading && !this.data.loadingMore) {
      this._loadNextPage();
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onClearKeyword() {
    this.setData({ keyword: '' });
  },

  onSearch() {
    this._loadFirstPage();
  },

  onTapCourse(course) {
    if (!course || !course.id) return;
    my.navigateTo({ url: `/pages/course/detail/index?courseId=${course.id}` });
  },

  _loadFirstPage() {
    const activeKeyword = this.data.keyword.trim();
    this.setData({
      activeKeyword,
      courses: [],
      page: 1,
      hasNext: true,
      loading: true,
    });
    return this._fetch(1, activeKeyword)
      .then((res) => {
        this.setData({
          courses: res.items,
          page: res.page,
          pageSize: res.pageSize,
          hasNext: res.hasNext,
          loading: false,
        });
      })
      .catch(() => this.setData({ loading: false }));
  },

  _loadNextPage() {
    this.setData({ loadingMore: true });
    return this._fetch(this.data.page + 1, this.data.activeKeyword)
      .then((res) => {
        this.setData({
          courses: this.data.courses.concat(res.items),
          page: res.page,
          hasNext: res.hasNext,
          loadingMore: false,
        });
      })
      .catch(() => this.setData({ loadingMore: false }));
  },

  _fetch(page, keyword) {
    const data = { page, pageSize: this.data.pageSize };
    if (keyword) data.keyword = keyword;
    return request({
      url: '/courses',
      method: 'GET',
      data,
      noAuth: true,
    });
  },
});
