import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./index.css";

export default function GatePage() {
  const [checking, setChecking] = useState(true);
  const { isLoggedIn, setToken, setProfile } = useUserStore();

  useEffect(() => {
    const init = async () => {
      if (isLoggedIn) {
        Taro.switchTab({ url: "/pages/index/index" });
        return;
      }

      const phone = Taro.getStorageSync("registeredPhone");
      if (phone) {
        try {
          const { code: authCode } = await Taro.login();
          const res = await api.alipayLogin(authCode, undefined, undefined);
          setToken(res.token);
          setProfile(res.student);
          Taro.switchTab({ url: "/pages/index/index" });
          return;
        } catch {
          // 静默登录失败，回落到欢迎页
        }
      }

      setChecking(false);
    };

    init();
  }, []);

  const handleGoRegister = () => {
    Taro.navigateTo({ url: "/pages/auth/register" });
  };

  const handleGoLogin = () => {
    Taro.navigateTo({ url: "/pages/auth/login" });
  };

  if (checking) {
    return (
      <View className='gate-page'>
        <View className='hero'>
          <Text className='logo'>网课超市</Text>
          <Text className='tagline'>先学后付 · 放心上课</Text>
        </View>
        <Text style={{ textAlign: "center", color: "#999", fontSize: "28px" }}>
          加载中...
        </Text>
      </View>
    );
  }

  return (
    <View className='gate-page'>
      <View className='hero'>
        <Text className='logo'>网课超市</Text>
        <Text className='tagline'>先学后付 · 放心上课</Text>
      </View>

      <View className='welcome-desc'>
        <Text className='welcome-text'>
          优质在线课程，先体验后付款。由业务员邀请注册，开启学习之旅。
        </Text>
      </View>

      <View className='welcome-actions'>
        <Button className='welcome-btn-primary' onClick={handleGoRegister}>
          立即注册
        </Button>
        <Button className='welcome-btn-secondary' onClick={handleGoLogin}>
          已有账号，去登录
        </Button>
      </View>

      <View className='steps'>
        <View className='step'>
          <Text className='step-num'>1</Text>
          <Text className='step-text'>联系业务员获取机构码</Text>
        </View>
        <View className='step'>
          <Text className='step-num'>2</Text>
          <Text className='step-text'>手机注册并完成实名</Text>
        </View>
        <View className='step'>
          <Text className='step-num'>3</Text>
          <Text className='step-text'>免费试学，满意再付款</Text>
        </View>
      </View>
    </View>
  );
}
