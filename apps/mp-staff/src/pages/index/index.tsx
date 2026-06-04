import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./index.css";

export default function StaffIndexPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [staffId, setStaffId] = useState("");

  useEffect(() => {
    const sid = Taro.getStorageSync("staff_id");
    if (!sid) {
      Taro.redirectTo({ url: "/pages/auth/login" });
      return;
    }
    setStaffId(sid);
    staffApi.getCommissionDashboard().then(setDashboard).catch(console.error);
  }, []);

  const qrUrl = `${process.env.TARO_APP_SHARE_URL || "https://mp.wangke.com"}/register?staff=${staffId}`;

  return (
    <View className='staff-index'>
      <View className='header'>
        <Text className='greeting'>业务员工作台</Text>
        <Text className='header-subtitle'>
          邀请码、学员状态和提成进度都集中在这里处理。
        </Text>
      </View>

      <View className='stats-grid'>
        <View className='stat-card'>
          <Text className='stat-value'>
            ¥{((dashboard?.settled || 0) / 100).toFixed(0)}
          </Text>
          <Text className='stat-label'>已结算提成</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-value'>
            ¥{((dashboard?.pending || 0) / 100).toFixed(0)}
          </Text>
          <Text className='stat-label'>待结算提成</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-value'>
            ¥{((dashboard?.held || 0) / 100).toFixed(0)}
          </Text>
          <Text className='stat-label'>暂缓（逾期中）</Text>
        </View>
      </View>

      <View className='qr-card'>
        <Text className='qr-title'>我的专属邀请码</Text>
        <Text className='qr-desc'>分享给学员，绑定归属关系</Text>
        <Text className='qr-link'>{qrUrl}</Text>
        <Text className='qr-tip'>注：强催收由机构执行，请勿代行债权催收</Text>
      </View>

      <View className='nav-list'>
        <View
          className='nav-item'
          onClick={() => Taro.navigateTo({ url: "/pages/students/list" })}
        >
          <Text className='nav-label'>我的学员列表</Text>
          <Text className='nav-arrow'>→</Text>
        </View>
        <View
          className='nav-item'
          onClick={() => Taro.navigateTo({ url: "/pages/commission/index" })}
        >
          <Text className='nav-label'>提成明细</Text>
          <Text className='nav-arrow'>→</Text>
        </View>
      </View>
    </View>
  );
}
