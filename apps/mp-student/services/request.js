const { baseUrl } = require("../config/index");

const STORAGE_KEY = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
};

let isRefreshing = false;
let pendingQueue = [];

function getAccessToken() {
  try {
    return my.getStorageSync({ key: STORAGE_KEY.ACCESS_TOKEN }).data || null;
  } catch (e) {
    return null;
  }
}

function getRefreshToken() {
  try {
    return my.getStorageSync({ key: STORAGE_KEY.REFRESH_TOKEN }).data || null;
  } catch (e) {
    return null;
  }
}

function saveTokens(accessToken, refreshToken) {
  my.setStorageSync({ key: STORAGE_KEY.ACCESS_TOKEN, data: accessToken });
  my.setStorageSync({ key: STORAGE_KEY.REFRESH_TOKEN, data: refreshToken });
  const app = getApp();
  if (app) app.globalData.accessToken = accessToken;
}

function clearTokens() {
  my.removeStorageSync({ key: STORAGE_KEY.ACCESS_TOKEN });
  my.removeStorageSync({ key: STORAGE_KEY.REFRESH_TOKEN });
  const app = getApp();
  if (app) {
    app.globalData.accessToken = null;
    app.globalData.studentId = null;
  }
}

function rawRequest(options) {
  return new Promise((resolve, reject) => {
    const { url, method = "GET", data, headers = {} } = options;

    my.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      success(res) {
        resolve(res);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error("no_refresh_token"));

  return rawRequest({
    url: "/auth/student/refresh",
    method: "POST",
    data: { refreshToken },
  }).then((res) => {
    if (res.status === 200 || res.status === 201) {
      const respData = res.data && res.data.data ? res.data.data : res.data;
      saveTokens(respData.accessToken, respData.refreshToken);
      return respData.accessToken;
    }
    clearTokens();
    return Promise.reject(new Error("refresh_failed"));
  });
}

function drainQueue(token) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectQueue(err) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

/**
 * 统一请求封装。
 * @param {object} options
 * @param {string}  options.url      - 接口路径（不含 baseUrl），如 '/auth/alipay/login'
 * @param {string}  [options.method] - HTTP 方法，默认 GET
 * @param {object}  [options.data]   - 请求体 / query 参数
 * @param {boolean} [options.noAuth] - true 时不附加 Authorization 头
 * @returns {Promise<any>} 接口 data 字段
 */
function request(options) {
  const { noAuth = false, _retry = false } = options;
  const headers = {};

  if (!noAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return rawRequest({ ...options, headers }).then((res) => {
    if (res.status === 200 || res.status === 201) {
      return res.data && res.data.data !== undefined ? res.data.data : res.data;
    }

    if (res.status === 401 && !noAuth && !_retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) =>
          request({
            ...options,
            _retry: true,
            headers: { Authorization: `Bearer ${newToken}` },
          }),
        );
      }

      isRefreshing = true;
      return doRefresh()
        .then((newToken) => {
          drainQueue(newToken);
          return request({ ...options, _retry: true });
        })
        .catch((err) => {
          rejectQueue(err);
          clearTokens();
          my.reLaunch({ url: "/pages/auth/login/index" });
          return Promise.reject(err);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    const errData = res.data || {};
    return Promise.reject(errData);
  });
}

module.exports = { request, saveTokens, clearTokens, STORAGE_KEY };
