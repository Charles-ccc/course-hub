import { useState, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button, Input } from "@tarojs/components";
import { api } from "../../services/api";
import "./login.css";

export default function ForgotPage() {
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: "请输入正确的手机号", icon: "none" });
      return;
    }
    try {
      await api.sendSmsCode(phone, "reset");
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

  const handleReset = async () => {
    if (!phone || !smsCode || !newPassword) {
      Taro.showToast({ title: "请填写所有信息", icon: "none" });
      return;
    }
    if (newPassword.length < 6) {
      Taro.showToast({ title: "密码至少6位", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(phone, smsCode, newPassword);
      Taro.showToast({ title: "密码重置成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "重置失败", icon: "none" });
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
          <Text className='logo-text'>忘记密码</Text>
          <Text className='logo-sub'>通过手机验证码重置密码</Text>
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
              placeholder='设置新密码（至少6位）'
              value={newPassword}
              onInput={(e) => setNewPassword(e.detail.value)}
            />
          </View>

          <Button
            className='btn-primary btn-primary--alipay'
            loading={loading}
            onClick={handleReset}
          >
            重置密码
          </Button>

          <View className='auth-links'>
            <Text className='auth-link' onClick={() => Taro.navigateBack()}>
              返回登录
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
