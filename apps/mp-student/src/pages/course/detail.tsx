import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import { api } from '../../services/api'
import './detail.css'

export default function CourseDetailPage() {
  const router = useRouter()
  const courseId = router.params.id!
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCourseDetail(courseId).then(setCourse).catch(console.error).finally(() => setLoading(false))
  }, [courseId])

  const handleBuy = async () => {
    try {
      Taro.showLoading({ title: '创建订单...' })
      const order = await api.createOrder(courseId)
      Taro.hideLoading()
      Taro.navigateTo({ url: `/pages/order/detail?id=${order.id}` })
    } catch (e: any) {
      Taro.hideLoading()
      Taro.showToast({ title: e.message || '下单失败', icon: 'none' })
    }
  }

  if (loading) return <View className='loading'><Text>加载中...</Text></View>
  if (!course) return <View className='loading'><Text>课程不存在</Text></View>

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
            <Text className='price-amount'>¥{((course.price / course.periodCount) / 100).toFixed(0)}</Text>
            <Text className='price-unit'>/期</Text>
          </View>
          <Text className='price-total'>共 {course.periodCount} 期 · 总价 ¥{(course.price / 100).toFixed(0)}</Text>
          <View className='price-tips'>
            <Text className='tip'>✓ 先学后付，每期上课后扣款</Text>
            <Text className='tip'>✓ 7天无条件退课</Text>
            <Text className='tip'>✓ 签约方为 {course.org?.name}（非平台）</Text>
          </View>
        </View>

        <View className='section'>
          <Text className='section-title'>课程大纲</Text>
          <Text className='section-content'>{course.outline}</Text>
        </View>

        <View className='section'>
          <Text className='section-title'>师资介绍</Text>
          <Text className='section-content'>{course.teacherInfo}</Text>
        </View>

        <View className='compliance-notice'>
          <Text className='notice-title'>重要提示</Text>
          <Text className='notice-text'>本课程由 {course.org?.name} 提供，付款对象为 {course.org?.name}。平台仅提供撮合服务，不参与收款。</Text>
        </View>
      </ScrollView>

      <View className='bottom-bar'>
        <Button className='buy-btn' onClick={handleBuy}>立即报名（先学后付）</Button>
      </View>
    </View>
  )
}
