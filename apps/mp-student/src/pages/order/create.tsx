import { useState } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { api } from "../../services/api";
import "./create.css";

export default function OrderCreatePage() {
  const router = useRouter();
  const courseId = router.params.courseId!;
  const [loading, setLoading] = useState(false);

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
        <Text className='order-create-tip'>
          下单后进入 7 天冷静期，可无条件退课
        </Text>
        <Text className='order-create-tip'>
          签约方与收款方均为课程机构，平台不参与收款
        </Text>
      </View>
      <Button
        className='order-create-button'
        loading={loading}
        onClick={handleCreate}
      >
        确认下单并签约
      </Button>
    </View>
  );
}
