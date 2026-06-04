import { useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Input, Button } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./realname.css";

export default function RealnamePage() {
  const [form, setForm] = useState({ name: "", idNo: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const setProfile = useUserStore((state) => state.setProfile);

  const handleSubmit = async () => {
    if (!form.name || !form.idNo || !form.phone) {
      return Taro.showToast({ title: "请填写完整信息", icon: "none" });
    }
    setLoading(true);
    try {
      const profile = await api.verifyRealname(form);
      setProfile(profile);
      Taro.showToast({ title: "实名认证成功", icon: "success" });
      setTimeout(() => Taro.switchTab({ url: "/pages/index/index" }), 1500);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "认证失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='realname-page'>
      <View className='header'>
        <Text className='title'>实名认证</Text>
        <Text className='sub'>为保障资金安全，需完成实名认证</Text>
      </View>

      <View className='form'>
        <View className='field'>
          <Text className='label'>真实姓名</Text>
          <Input
            className='input'
            placeholder='请输入真实姓名'
            value={form.name}
            onInput={(e) => setForm({ ...form, name: e.detail.value })}
          />
        </View>
        <View className='field'>
          <Text className='label'>身份证号</Text>
          <Input
            className='input'
            placeholder='请输入18位身份证号'
            value={form.idNo}
            onInput={(e) => setForm({ ...form, idNo: e.detail.value })}
          />
        </View>
        <View className='field'>
          <Text className='label'>手机号码</Text>
          <Input
            className='input'
            type='number'
            placeholder='请输入手机号'
            value={form.phone}
            onInput={(e) => setForm({ ...form, phone: e.detail.value })}
          />
        </View>
      </View>

      <View className='notice'>
        <Text className='notice-text'>
          您的身份信息将加密保存，仅用于实名认证
        </Text>
      </View>

      <Button className='submit-btn' loading={loading} onClick={handleSubmit}>
        确认提交
      </Button>
    </View>
  );
}
