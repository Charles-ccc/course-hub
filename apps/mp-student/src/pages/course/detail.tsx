import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, ScrollView, Button } from "@tarojs/components";
import { api } from "../../services/api";
import "./detail.css";

export default function CourseDetailPage() {
  const router = useRouter();
  const courseId = router.params.id!;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payType, setPayType] = useState<"instant" | "installment">("instant");
  const [trialConfirmed, setTrialConfirmed] = useState(false);

  useEffect(() => {
    api
      .getCourseDetail(courseId)
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleTrial = () => {
    Taro.navigateTo({
      url: `/pages/learning/player?courseId=${courseId}&trial=1`,
    });
  };

  const handleBuy = () => {
    if (!trialConfirmed) {
      Taro.showModal({
        title: "购课须知",
        content:
          "您已体验试学课程，认可课程质量。购买后同意不退课、不退款，请确认。",
        confirmText: "确认购买",
        cancelText: "再想想",
        success: (res) => {
          if (res.confirm) {
            setTrialConfirmed(true);
            goToCreate();
          }
        },
      });
    } else {
      goToCreate();
    }
  };

  const goToCreate = () => {
    Taro.navigateTo({
      url: `/pages/order/create?courseId=${courseId}&payType=${payType}`,
    });
  };

  if (loading)
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    );
  if (!course)
    return (
      <View className='loading'>
        <Text>课程不存在</Text>
      </View>
    );

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='scroll-area'>
        <View className='hero'>
          <Text className='course-title'>{course.title}</Text>
          <View className='org-badge'>
            <Text className='org-name'>主办机构：{course.org?.name}</Text>
          </View>
        </View>

        <View className='price-card'>
          <View className='price-main'>
            <Text className='price-amount'>
              ¥{((course.price / course.periodCount) / 100).toFixed(0)}
            </Text>
            <Text className='price-unit'>/期</Text>
          </View>
          <Text className='price-total'>
            共 {course.periodCount} 期 · 总价 ¥{(course.price / 100).toFixed(0)}
          </Text>
          <View className='price-tips'>
            <Text className='tip'>✓ 先体验后付款，课程质量有保障</Text>
            <Text className='tip'>✓ 签约方为 {course.org?.name}（非平台）</Text>
          </View>
        </View>

        <View className='benefits-card'>
          <Text className='benefits-title'>先学后付权益</Text>
          <View className='benefit-item'>
            <Text className='benefit-icon'>📖</Text>
            <Text className='benefit-text'>免费试学第一节课，满意再报名</Text>
          </View>
          <View className='benefit-item'>
            <Text className='benefit-icon'>💰</Text>
            <Text className='benefit-text'>按期付款，每期上课后结算</Text>
          </View>
          <View className='benefit-item'>
            <Text className='benefit-icon'>🎓</Text>
            <Text className='benefit-text'>专业老师一对一辅导</Text>
          </View>
        </View>

        <View className='section'>
          <Text className='section-title'>课程大纲</Text>
          <Text className='section-content'>{course.outline}</Text>
        </View>

        <View className='compliance-notice'>
          <Text className='notice-title'>温馨提示</Text>
          <Text className='notice-text'>
            本课程由 {course.org?.name} 提供，付款对象为{" "}
            {course.org?.name}。平台仅提供撮合服务，不参与收款。购课前请完整体验试学课程，购课后不支持退课退款。
          </Text>
        </View>
      </ScrollView>

      <View className='bottom-bar'>
        <Button className='trial-btn' onClick={handleTrial}>
          免费试学第一节
        </Button>
        <View className='pay-type-selector'>
          <View
            className={`pay-type-option ${payType === "instant" ? "pay-type-option--active" : ""}`}
            onClick={() => setPayType("instant")}
          >
            <Text className='pay-type-radio'>
              {payType === "instant" ? "●" : "○"}
            </Text>
            <Text className='pay-type-label'>立即付款（默认）</Text>
          </View>
          <View
            className={`pay-type-option ${payType === "installment" ? "pay-type-option--active" : ""}`}
            onClick={() => setPayType("installment")}
          >
            <Text className='pay-type-radio'>
              {payType === "installment" ? "●" : "○"}
            </Text>
            <Text className='pay-type-label'>先学后付</Text>
          </View>
        </View>
        <Button className='buy-btn' onClick={handleBuy}>
          立即报名
        </Button>
      </View>
    </View>
  );
}
