import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button, Input } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./login.css";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setToken = useUserStore((s) => s.setToken);
  const setProfile = useUserStore((s) => s.setProfile);

  const handleLogin = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: "请填写手机号和密码", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.loginByPhone(phone, password);
      setToken(res.token);
      setProfile(res.student);
      Taro.setStorageSync("registeredPhone", phone);
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

  const isDev = process.env.NODE_ENV === "development";

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const res = await api.loginByPhone("13800138000", "dev123456");
      setToken(res.token);
      setProfile(res.student);
      Taro.setStorageSync("registeredPhone", "13800138000");
      Taro.switchTab({ url: "/pages/index/index" });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login-page'>
      <View className='login-orb login-orb--left' />
      <View className='login-orb login-orb--right' />

      <View className='login-shell'>
        <View className='logo-area'>
          <Text className='logo-text'>网课超市</Text>
          <Text className='logo-sub'>先学后付 · 放心上课</Text>
        </View>

        <View className='login-card'>
          <View className='login-card-header'>
            <Text className='login-card-title'>手机号登录</Text>
            <Text className='login-card-desc'>使用注册手机号和密码登录</Text>
          </View>

          <View className='form-group'>
            <Input
              className='form-input'
              type='number'
              placeholder='请输入手机号'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>

          <View className='form-group'>
            <Input
              className='form-input'
              password
              placeholder='请输入密码'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            className='btn-primary btn-primary--alipay'
            loading={loading}
            onClick={handleLogin}
          >
            登录
          </Button>

          <View className='auth-links'>
            <Text
              className='auth-link'
              onClick={() => Taro.navigateTo({ url: "/pages/auth/register" })}
            >
              注册账号
            </Text>
            <Text
              className='auth-link'
              onClick={() => Taro.navigateTo({ url: "/pages/auth/forgot" })}
            >
              忘记密码
            </Text>
          </View>

          <View className='tips'>
            <Text className='tips-text'>登录即同意《用户协议》和《隐私政策》</Text>
          </View>

          {isDev && (
            <Button
              className='btn-dev-login'
              loading={loading}
              onClick={handleDevLogin}
            >
              开发者快捷登录
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
