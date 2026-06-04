import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, ScrollView, Button } from "@tarojs/components";
import { api } from "../../services/api";
import "./index.css";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待解锁",
  DELIVERED: "已解锁/待扣款",
  PAID: "已完成",
  OVERDUE: "已逾期",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#999",
  DELIVERED: "#F59E0B",
  PAID: "#10B981",
  OVERDUE: "#EF4444",
};

export default function LearningPage() {
  const router = useRouter();
  const orderId = router.params.orderId!;
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLearningProgress(orderId)
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading)
    return (
      <View className='learning-loading'>
        <Text>加载中...</Text>
      </View>
    );

  const items = progress?.installments || [];
  const checkins = progress?.checkins || [];
  const incentives = progress?.incentives || [];
  const totalIncentive = incentives.reduce(
    (s: number, i: any) => s + i.amount,
    0,
  );

  return (
    <View className='learning-page'>
      <View className='learning-balance-card'>
        <Text className='learning-balance-label'>学习激励余额</Text>
        <Text className='learning-balance-value'>
          ¥{(totalIncentive / 100).toFixed(2)}
        </Text>
        <Text className='learning-balance-subtitle'>
          累计打卡 {checkins.filter((c: any) => c.matched).length} 次
        </Text>
      </View>

      <Text className='learning-section-title'>课程进度</Text>
      <ScrollView scrollY className='learning-list'>
        {items.map((item: any) => (
          <View key={item.id} className='learning-item'>
            <View>
              <Text className='learning-item-title'>第 {item.periodNo} 期</Text>
              <Text className='learning-item-date'>
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
            <View className='learning-item-right'>
              <Text className='learning-item-amount'>
                ¥{(item.actualAmount / 100).toFixed(0)}
              </Text>
              <Text
                className='learning-item-status'
                style={{ color: STATUS_COLOR[item.status] }}
              >
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Button
        className='learning-checkin-btn'
        onClick={() =>
          Taro.navigateTo({ url: `/pages/learning/checkin?orderId=${orderId}` })
        }
      >
        扫脸打卡领激励
      </Button>
    </View>
  );
}
