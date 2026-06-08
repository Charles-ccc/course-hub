import { useState } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { api } from "../../services/api";
import "./create.css";

export default function OrderCreatePage() {
  const router = useRouter();
  const courseId = router.params.courseId!;
  const payType = router.params.payType || "instant";
  const [loading, setLoading] = useState(false);

  const isInstant = payType === "instant";

  const handleCreate = async () => {
    setLoading(true);
    try {
      const order = await api.createOrder(courseId);
      Taro.showToast({ title: "订单创建成功", icon: "success" });
      setTimeout(
        () => Taro.redirectTo({ url: `/pages/order/detail?id=${order.id}` }),
        1500,
      );
    } catch (e: any) {
      Taro.showToast({ title: e.message || "创建失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='order-create-page'>
      <Text className='order-create-title'>确认下单</Text>
      <View className='order-create-card'>
        {isInstant ? (
          <>
            <Text className='order-create-tip order-create-tip--highlight'>
              一次性付款，立即开始学习
            </Text>
            <Text className='order-create-tip'>
              签约方与收款方均为课程机构，平台不参与收款
            </Text>
          </>
        ) : (
          <>
            <Text className='order-create-tip order-create-tip--highlight'>
              先学后付，每期课程结束后再扣款
            </Text>
            <Text className='order-create-tip'>
              签约前请仔细阅读授权协议，完成签约后开始学习
            </Text>
            <Text className='order-create-tip'>
              签约方与收款方均为课程机构，平台不参与收款
            </Text>
          </>
        )}
      </View>
      <Button
        className='order-create-button'
        loading={loading}
        onClick={handleCreate}
      >
        {isInstant ? "确认付款" : "确认并签约"}
      </Button>
    </View>
  );
}
