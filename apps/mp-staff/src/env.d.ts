declare const process: {
  env: {
    NODE_ENV?: string;
    TARO_APP_API_URL?: string;
    TARO_APP_SHARE_URL?: string;
    TARO_APP_USE_FRONTEND_MOCK?: string;
    [key: string]: string | undefined;
  };
};
