import { useState } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setToken = useUserStore((s) => s.setToken);
  const setProfile = useUserStore((s) => s.setProfile);

  // 优先用 URL 参数，其次读 storage（扫码时已存入）
  const referrerStaffId =
    router.params.staff || Taro.getStorageSync("referrerStaffId") || undefined;
  const referrerStudentId =
    router.params.inv || Taro.getStorageSync("referrerStudentId") || undefined;

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      const { code } = await Taro.login();
      const res = await api.wechatLogin(
        code,
        referrerStaffId,
        referrerStudentId,
      );
      setToken(res.token);
      setProfile(res.student);

      if (res.isNew) {
        Taro.redirectTo({ url: "/pages/auth/realname" });
      } else {
        Taro.switchTab({ url: "/pages/index/index" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAlipayLogin = async () => {
    setLoading(true);
    try {
      const { code: authCode } = await Taro.login();
      const res = await api.alipayLogin(
        authCode,
        referrerStaffId as string,
        referrerStudentId as string,
      );
      setToken(res.token);
      setProfile(res.student);

      if (res.isNew) {
        Taro.redirectTo({ url: "/pages/auth/realname" });
      } else {
        Taro.switchTab({ url: "/pages/index/index" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const isWeixin = Taro.getEnv() === Taro.ENV_TYPE.WEAPP;
  const isAlipay = Taro.getEnv() === Taro.ENV_TYPE.ALIPAY;
  const platformLabel = isAlipay ? "支付宝小程序" : "微信小程序";

  return (
    <View className='login-page'>
      <View className='login-orb login-orb--left' />
      <View className='login-orb login-orb--right' />

      <View className='login-shell'>
        <Text className='hero-badge'>STUDY NOW · PAY LATER</Text>

        <View className='logo-area'>
          <Text className='logo-text'>网课超市</Text>
          <Text className='logo-sub'>先学后付 · 放心上课</Text>
          <Text className='logo-desc'>
            课程浏览、下单签约、学习进度与还款计划，在一个登录入口里完成。
          </Text>
        </View>

        <View className='hero-chips'>
          <Text className='hero-chip'>实名后开学</Text>
          <Text className='hero-chip'>签约前先看清流程</Text>
          <Text className='hero-chip'>学习进度随时可查</Text>
        </View>

        <View className='login-card'>
          <View className='login-card-header'>
            <Text className='login-card-title'>学员快捷登录</Text>
            <Text className='login-card-desc'>
              授权后即可进入选课、签约与学习流程
            </Text>
          </View>

          <View className='platform-row'>
            <Text className='platform-tag'>{platformLabel}</Text>
            <Text className='platform-hint'>首次登录后将继续完成实名信息</Text>
          </View>

          {isWeixin && (
            <Button
              className='btn-primary btn-primary--weixin'
              loading={loading}
              onClick={handleWechatLogin}
            >
              微信一键登录
            </Button>
          )}

          {isAlipay && (
            <Button
              className='btn-primary btn-primary--alipay'
              loading={loading}
              onClick={handleAlipayLogin}
            >
              支付宝一键登录
            </Button>
          )}

          <View className='promise-list'>
            <View className='promise-item'>
              <Text className='promise-title'>流程更清楚</Text>
              <Text className='promise-desc'>
                先看课程与规则，再决定是否继续签约与学习。
              </Text>
            </View>
            <View className='promise-item'>
              <Text className='promise-title'>节奏更从容</Text>
              <Text className='promise-desc'>
                新用户先完成授权与实名，不把表单一次性堆满。
              </Text>
            </View>
          </View>

          <View className='tips'>
            <Text className='tips-text'>
              登录即同意《用户协议》和《隐私政策》
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
