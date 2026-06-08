import { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Canvas, Image } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./index.css";

function useQrDataUrl(text: string): string {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    if (!text) return;
    // qrcode only available in H5; skip in mini-program environments
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require("qrcode");
      QRCode.toDataURL(text, { width: 200, margin: 2 }, (_err: any, url: string) => {
        if (url) setDataUrl(url);
      });
    } catch {
      // mini-program build: qrcode not available, silently skip
    }
  }, [text]);
  return dataUrl;
}

export default function StaffIndexPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [staffId, setStaffId] = useState("");
  const [copied, setCopied] = useState(false);

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
  const qrDataUrl = useQrDataUrl(staffId ? qrUrl : "");

  const handleCopy = () => {
    Taro.setClipboardData({ data: qrUrl });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <View className='qr-card-header'>
          <View>
            <Text className='qr-title'>邀请学员</Text>
            <Text className='qr-desc'>扫码后学员将自动绑定至您名下</Text>
          </View>
          <View className='qr-copy-btn' onClick={handleCopy}>
            <Text className='qr-copy-text'>{copied ? "已复制" : "复制链接"}</Text>
          </View>
        </View>

        {qrDataUrl ? (
          <View className='qr-image-wrap'>
            <Image className='qr-image' src={qrDataUrl} mode='aspectFit' />
          </View>
        ) : (
          <View className='qr-link-box'>
            <Text className='qr-link'>{qrUrl}</Text>
          </View>
        )}
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
