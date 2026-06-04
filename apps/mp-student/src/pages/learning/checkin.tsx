import { useState } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { api } from "../../services/api";
import "./checkin.css";

export default function CheckinPage() {
  const router = useRouter();
  const orderId = router.params.orderId!;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheckin = async () => {
    setLoading(true);
    try {
      // 生产：调用微信/支付宝人脸核身，获取 faceToken
      const faceToken = `mock_face_${Date.now()}`;
      const res = await api.checkin(orderId, 1, faceToken);
      setResult(res);
      if (res.matched) {
        Taro.showToast({ title: "打卡成功！已发放学习激励", icon: "success" });
      } else {
        Taro.showToast({ title: "人脸比对失败，请重试", icon: "none" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "打卡失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='checkin-page'>
      <View className='checkin-avatar'>
        <Text className='checkin-avatar-icon'>👤</Text>
      </View>

      <Text className='checkin-title'>扫脸打卡</Text>
      <Text className='checkin-desc'>
        完成人脸比对确认本人学习，获得课程激励抵扣下期费用
      </Text>

      {result && (
        <View
          className={`checkin-result ${result.matched ? "checkin-result--success" : "checkin-result--error"}`}
        >
          <Text
            className={`checkin-result-text ${result.matched ? "checkin-result-text--success" : "checkin-result-text--error"}`}
          >
            {result.matched ? "✅ 打卡成功，激励已发放" : "❌ 比对失败"}
          </Text>
        </View>
      )}

      <Button
        className='checkin-button'
        loading={loading}
        onClick={handleCheckin}
      >
        {result ? "再次打卡" : "开始人脸验证"}
      </Button>
    </View>
  );
}
