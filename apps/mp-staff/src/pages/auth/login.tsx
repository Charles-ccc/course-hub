import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./login.css";

export default function StaffLoginPage() {
  const [loading, setLoading] = useState(false);

  const isAlipay = Taro.getEnv() === Taro.ENV_TYPE.ALIPAY;
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP;
  const platformLabel = isAlipay ? "支付宝小程序" : "微信小程序";

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      const { code } = await Taro.login();
      await staffApi.loginWithWechat(code);
      Taro.switchTab({ url: "/pages/index/index" });
    } catch (e: any) {
      console.error(e);
      Taro.showToast({
        title: "网络错误，请检查是否关闭域名校验",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlipayLogin = async () => {
    setLoading(true);
    try {
      const { code: authCode } = await Taro.login();
      await staffApi.loginWithAlipay(authCode);
      Taro.switchTab({ url: "/pages/index/index" });
    } catch (e: any) {
      console.error(e);
      Taro.showToast({
        title: "支付宝登录失败，请检查域名白名单",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='staff-login-page'>
      <View className='staff-halo staff-halo--primary' />
      <View className='staff-halo staff-halo--secondary' />

      <View className='staff-shell'>
        <View className='staff-header'>
          <Text className='staff-badge'>STAFF CONSOLE</Text>
          <Text className='staff-title'>业务员工作台</Text>
          <Text className='staff-subtitle'>
            管理学员、查看提成、追踪邀请转化，入口更清楚，信息层级更利落。
          </Text>
        </View>

        <View className='staff-pill-row'>
          <Text className='staff-pill'>学员归属</Text>
          <Text className='staff-pill'>提成看板</Text>
          <Text className='staff-pill'>邀请增长</Text>
        </View>

        <View className='staff-login-card'>
          <View className='staff-card-top'>
            <Text className='staff-card-title'>授权登录</Text>
            <Text className='staff-card-desc'>
              仅限已审核业务员使用，进入后即可查看工作台。
            </Text>
          </View>

          <View className='staff-platform-row'>
            <Text className='staff-platform-tag'>{platformLabel}</Text>
            <Text className='staff-platform-hint'>
              当前环境将用于绑定业务员登录态
            </Text>
          </View>

          {isWeapp && (
            <Button
              className='staff-login-button staff-login-button--weixin'
              loading={loading}
              onClick={handleWechatLogin}
            >
              微信一键登录
            </Button>
          )}

          {isAlipay && (
            <Button
              className='staff-login-button staff-login-button--alipay'
              loading={loading}
              onClick={handleAlipayLogin}
            >
              支付宝一键登录
            </Button>
          )}

          <View className='staff-promise-list'>
            <View className='staff-promise-item'>
              <Text className='staff-promise-title'>字号与间距重新整理</Text>
              <Text className='staff-promise-desc'>
                让标题、说明与操作按钮在小屏幕上不再显得拥挤。
              </Text>
            </View>
            <View className='staff-promise-item'>
              <Text className='staff-promise-title'>工作入口更聚焦</Text>
              <Text className='staff-promise-desc'>
                先完成授权，再进入提成与学员列表，减少无效跳转。
              </Text>
            </View>
          </View>

          <Text className='staff-footer-note'>仅限已审核的业务员使用</Text>
        </View>
      </View>
    </View>
  );
}
