import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./index.css";

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    staffApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  const handleLogout = () => {
    Taro.removeStorageSync("staff_token");
    Taro.removeStorageSync("staff_id");
    Taro.removeStorageSync("staff_profile");
    Taro.redirectTo({ url: "/pages/auth/login" });
  };

  return (
    <View className='staff-profile-page'>
      <View className='staff-profile-card'>
        <View className='staff-profile-avatar'>
          <Text className='staff-profile-avatar-text'>业</Text>
        </View>
        <Text className='staff-profile-title'>{profile?.name || "业务员"}</Text>
        <Text className='staff-profile-id'>{profile?.id || "未登录"}</Text>
        <Text className='staff-profile-id'>
          {profile?.phone || "未绑定手机号"}
        </Text>
        <Text className='staff-profile-id'>
          {profile?.contractType === "EMPLOYEE" ? "员工制" : "代理制"}
          {profile?.groupName ? ` · ${profile.groupName}` : ""}
        </Text>
      </View>
      <View className='staff-profile-menu'>
        <View
          className='staff-profile-menu-item'
          onClick={() => Taro.switchTab({ url: "/pages/students/list" })}
        >
          <Text className='staff-profile-menu-label'>我的学员</Text>
          <Text className='staff-profile-menu-arrow'>→</Text>
        </View>
        <View
          className='staff-profile-menu-item'
          onClick={() => Taro.switchTab({ url: "/pages/commission/index" })}
        >
          <Text className='staff-profile-menu-label'>提成明细</Text>
          <Text className='staff-profile-menu-arrow'>→</Text>
        </View>
      </View>
      <Button className='staff-profile-logout' onClick={handleLogout}>
        退出登录
      </Button>
    </View>
  );
}
