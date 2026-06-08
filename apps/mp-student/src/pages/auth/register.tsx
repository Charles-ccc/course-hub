import { useState, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button, Input } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./login.css";

export default function RegisterPage() {
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);
  const setToken = useUserStore((s) => s.setToken);
  const setProfile = useUserStore((s) => s.setProfile);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: "请输入正确的手机号", icon: "none" });
      return;
    }
    try {
      await api.sendSmsCode(phone, "register");
      Taro.showToast({ title: "验证码已发送", icon: "success" });
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "发送失败", icon: "none" });
    }
  };

  const handleRegister = async () => {
    if (!phone || !smsCode || !password || !confirmPassword || !orgCode) {
      Taro.showToast({ title: "请填写所有信息", icon: "none" });
      return;
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: "两次密码不一致", icon: "none" });
      return;
    }
    if (password.length < 6) {
      Taro.showToast({ title: "密码至少6位", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.registerByPhone(phone, smsCode, password, orgCode);
      setToken(res.token);
      setProfile(res.student);
      Taro.setStorageSync("registeredPhone", phone);
      Taro.redirectTo({ url: "/pages/auth/realname" });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "注册失败", icon: "none" });
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
          <Text className='logo-text'>注册账号</Text>
          <Text className='logo-sub'>加入网课超市</Text>
        </View>

        <View className='login-card'>
          <View className='form-group'>
            <Input
              className='form-input'
              type='number'
              placeholder='请输入手机号'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>

          <View className='sms-row'>
            <Input
              className='form-input'
              type='number'
              placeholder='短信验证码'
              value={smsCode}
              onInput={(e) => setSmsCode(e.detail.value)}
            />
            <Button
              className='btn-sms'
              disabled={countdown > 0}
              onClick={handleSendCode}
            >
              {countdown > 0 ? `${countdown}s` : "发送验证码"}
            </Button>
          </View>

          <View className='form-group'>
            <Input
              className='form-input'
              password
              placeholder='设置密码（至少6位）'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <View className='form-group'>
            <Input
              className='form-input'
              password
              placeholder='确认密码'
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.detail.value)}
            />
          </View>

          <Text className='org-code-hint'>机构码由业务员提供</Text>
          <View className='form-group'>
            <Input
              className='form-input'
              placeholder='请输入机构码（业务员邀请码）'
              value={orgCode}
              onInput={(e) => setOrgCode(e.detail.value)}
            />
          </View>

          <Button
            className='btn-primary btn-primary--alipay'
            loading={loading}
            onClick={handleRegister}
          >
            立即注册
          </Button>

          <View className='auth-links'>
            <Text
              className='auth-link'
              onClick={() => Taro.navigateTo({ url: "/pages/auth/login" })}
            >
              已有账号，去登录
            </Text>
          </View>

          <View className='tips'>
            <Text className='tips-text'>注册即同意《用户协议》和《隐私政策》</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
