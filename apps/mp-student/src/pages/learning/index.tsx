import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text, ScrollView } from "@tarojs/components";
import { api } from "../../services/api";
import { useUserStore } from "../../store";
import "./index.css";

const STATUS_LABEL: Record<string, string> = {
  CREATED: "待签约",
  ACTIVE: "学习中",
  COMPLETED: "已完成",
  TERMINATED: "已终止",
};

const STATUS_COLOR: Record<string, string> = {
  CREATED: "#F59E0B",
  ACTIVE: "#10B981",
  COMPLETED: "#6B7280",
  TERMINATED: "#6B7280",
};

export default function LearningPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      Taro.redirectTo({ url: "/pages/auth/login" });
      return;
    }
    api
      .getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCourseClick = (order: any) => {
    if (order.status === "ACTIVE" || order.status === "COMPLETED") {
      Taro.navigateTo({
        url: `/pages/learning/player?orderId=${order.id}&courseId=${order.course?.id}`,
      });
    } else {
      Taro.navigateTo({ url: `/pages/order/detail?id=${order.id}` });
    }
  };

  if (loading)
    return (
      <View className='learning-loading'>
        <Text>加载中...</Text>
      </View>
    );

  return (
    <View className='learning-page'>
      <Text className='learning-page-title'>我的学习</Text>
      <ScrollView scrollY className='learning-list'>
        {orders.map((order) => (
          <View
            key={order.id}
            className='learning-course-card'
            onClick={() => handleCourseClick(order)}
          >
            <View className='learning-course-header'>
              <Text className='learning-course-title'>
                {order.course?.title}
              </Text>
              <Text
                className='learning-course-status'
                style={{ color: STATUS_COLOR[order.status] || "#6B7280" }}
              >
                {STATUS_LABEL[order.status] || order.status}
              </Text>
            </View>
            <Text className='learning-course-org'>{order.sellerOrg?.name}</Text>
            <View className='learning-course-footer'>
              <Text className='learning-course-amount'>
                ¥{(order.totalAmount / 100).toFixed(0)}
              </Text>
              {(order.status === "ACTIVE" || order.status === "COMPLETED") && (
                <View className='learning-course-action'>
                  <Text className='learning-course-action-text'>
                    点击播放课程 →
                  </Text>
                </View>
              )}
            </View>
            {order.status === "ACTIVE" && (
              <View className='learning-teacher-btn-wrap'>
                <Text
                  className='learning-teacher-link'
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.navigateTo({
                      url: `/pages/learning/teacher?courseId=${order.course?.id}`,
                    });
                  }}
                >
                  联系老师
                </Text>
              </View>
            )}
          </View>
        ))}
        {orders.length === 0 && (
          <View className='learning-empty'>
            <Text className='learning-empty-text'>还没有报名课程</Text>
            <Text
              className='learning-empty-link'
              onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
            >
              去选课 →
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
