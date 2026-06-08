import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button, ScrollView } from "@tarojs/components";
import { api } from "../../services/api";
import "./detail.css";

export default function OrderDetailPage() {
  const router = useRouter();
  const orderId = router.params.id!;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOrderDetail(orderId)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSign = async () => {
    try {
      Taro.showLoading({ title: "跳转签约..." });
      await api.signWithFadadada(orderId);
      Taro.hideLoading();
      Taro.showToast({ title: "签约完成", icon: "success" });
      setOrder({ ...order, status: "ACTIVE" });
    } catch (e: any) {
      Taro.hideLoading();
      Taro.showToast({ title: e.message || "签约失败", icon: "none" });
    }
  };

  if (loading)
    return (
      <View
        style={{
          textAlign: "center",
          padding: "100px",
          color: "#999",
          fontSize: "28px",
        }}
      >
        <Text>加载中...</Text>
      </View>
    );
  if (!order) return null;

  return (
    <View className='order-detail-page'>
      <ScrollView scrollY className='scroll-area'>
        <View className='order-info-card'>
          <Text className='course-title'>{order.course?.title}</Text>
          <Text className='org-name'>签约/收款方：{order.sellerOrg?.name}</Text>
          <View className='amount-grid'>
            <View className='amount-item'>
              <Text className='amount-label'>总金额</Text>
              <Text className='amount-value'>
                ¥{(order.totalAmount / 100).toFixed(0)}
              </Text>
            </View>
            <View className='amount-item'>
              <Text className='amount-label'>分期数</Text>
              <Text className='amount-value'>{order.periodCount} 期</Text>
            </View>
            <View className='amount-item'>
              <Text className='amount-label'>每期金额</Text>
              <Text className='amount-value'>
                ¥{(order.periodAmount / 100).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {order.status === "ACTIVE" || order.status === "COMPLETED" ? (
          <View className='installment-list'>
            <Text className='section-title'>分期计划</Text>
            {(order.installmentItems || []).map((item: any) => (
              <View key={item.id} className='installment-item'>
                <View className='item-left'>
                  <Text className='item-period'>第 {item.periodNo} 期</Text>
                  <Text className='item-date'>
                    {new Date(item.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View className='item-right'>
                  <Text className='item-amount'>
                    ¥{(item.actualAmount / 100).toFixed(0)}
                  </Text>
                  <Text
                    className={`item-status status-${item.status.toLowerCase()}`}
                  >
                    {item.status === "PAID"
                      ? "已还款"
                      : item.status === "OVERDUE"
                        ? "逾期"
                        : item.status === "DELIVERED"
                          ? "待扣款"
                          : "待解锁"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className='action-bar'>
        {order.status === "CREATED" && (
          <Button className='action-btn primary' onClick={handleSign}>
            签约授权（法大大）
          </Button>
        )}
        {order.status === "ACTIVE" && (
          <Button
            className='action-btn primary'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/learning/index?orderId=${orderId}`,
              })
            }
          >
            去学习
          </Button>
        )}
        {order.status === "COMPLETED" && (
          <View className='action-completed'>
            <Text>课程已完成</Text>
          </View>
        )}
      </View>
    </View>
  );
}
