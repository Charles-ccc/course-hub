import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Input, Button } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./login.css";

export default function StaffLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError("请输入手机号");
      return;
    }
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await staffApi.loginByPhone(phone.trim(), password);
      Taro.switchTab({ url: "/pages/index/index" });
    } catch (e: any) {
      setError(e?.message || "登录失败，请检查手机号或密码");
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
            <Text className='staff-card-title'>账号登录</Text>
            <Text className='staff-card-desc'>
              仅限已审核业务员使用，进入后即可查看工作台。
            </Text>
          </View>

          <View className='staff-form'>
            <View className='staff-input-group'>
              <Text className='staff-input-label'>手机号</Text>
              <Input
                className='staff-input'
                type='number'
                maxlength={11}
                placeholder='请输入手机号'
                placeholderClass='staff-input-placeholder'
                value={phone}
                onInput={(e) => setPhone(e.detail.value)}
              />
            </View>

            <View className='staff-input-group'>
              <Text className='staff-input-label'>密码</Text>
              <Input
                className='staff-input'
                password
                placeholder='请输入密码'
                placeholderClass='staff-input-placeholder'
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
            </View>

            {error ? (
              <Text className='staff-error-msg'>{error}</Text>
            ) : null}

            <Button
              className='staff-login-button'
              loading={loading}
              disabled={loading}
              onClick={handleLogin}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </View>

          <Text className='staff-footer-note'>仅限已审核的业务员使用</Text>
        </View>
      </View>
    </View>
  );
}
