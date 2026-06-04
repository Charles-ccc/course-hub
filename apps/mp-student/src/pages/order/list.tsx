import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { api } from '../../services/api'
import { useUserStore } from '../../store'
import './list.css'

const STATUS_LABEL: Record<string, string> = {
  CREATED: '待签约',
  COOLING_OFF: '冷静期',
  ACTIVE: '学习中',
  COMPLETED: '已完成',
  REFUNDED: '已退课',
  TERMINATED: '已终止',
}

const STATUS_COLOR: Record<string, string> = {
  CREATED: '#F59E0B',
  COOLING_OFF: '#3B82F6',
  ACTIVE: '#10B981',
  COMPLETED: '#6B7280',
  REFUNDED: '#EF4444',
  TERMINATED: '#6B7280',
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isLoggedIn = useUserStore(s => s.isLoggedIn)

  useEffect(() => {
    if (!isLoggedIn) {
      Taro.redirectTo({ url: '/pages/auth/login' })
      return
    }
    api.getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <View className='order-list-page'>
      <Text className='page-title'>我的课程</Text>
      {loading && <View className='loading'><Text>加载中...</Text></View>}
      <ScrollView scrollY className='list'>
        {orders.map(order => (
          <View key={order.id} className='order-card'
            onClick={() => Taro.navigateTo({ url: `/pages/order/detail?id=${order.id}` })}>
            <View className='order-header'>
              <Text className='course-name'>{order.course?.title}</Text>
              <Text className='status-tag' style={{ color: STATUS_COLOR[order.status] }}>
                {STATUS_LABEL[order.status]}
              </Text>
            </View>
            <Text className='org-name'>{order.sellerOrg?.name}</Text>
            <View className='order-footer'>
              <Text className='period-info'>
                {order.installmentItems?.filter((i: any) => i.status === 'PAID').length || 0} / {order.periodCount} 期已还
              </Text>
              <Text className='amount'>¥{(order.totalAmount / 100).toFixed(0)}</Text>
            </View>
          </View>
        ))}
        {!loading && orders.length === 0 && (
          <View className='empty'>
            <Text className='empty-text'>还没有报名课程</Text>
            <Text className='empty-link' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              去选课 →
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
