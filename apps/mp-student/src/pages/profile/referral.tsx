import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { api } from '../../services/api'
import './referral.css'

export default function ReferralPage() {
  const [link, setLink] = useState('')
  const [rewards, setRewards] = useState<any[]>([])

  useEffect(() => {
    api.generateInviteLink().then(r => setLink(r.link))
    api.getReferralRewards().then(setRewards)
  }, [])

  const handleShare = () => {
    Taro.showShareMenu({ withShareTicket: true })
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' })
  }

  const totalEarned = rewards.filter(r => r.status === 'PAID').reduce((s, r) => s + r.netAmount, 0)

  return (
    <View className='referral-page'>
      <View className='invite-card'>
        <Text className='invite-title'>邀请好友，共享奖励</Text>
        <Text className='invite-desc'>好友完成首期还款后，您获得现金奖励</Text>
        <View className='earned-amount'>
          <Text className='earned-label'>已获奖励</Text>
          <Text className='earned-value'>¥{(totalEarned / 100).toFixed(2)}</Text>
        </View>
        <Button className='share-btn' onClick={handleShare}>立即邀请好友</Button>
      </View>

      <View className='reward-list'>
        <Text className='list-title'>邀请记录</Text>
        {rewards.length === 0 && <Text className='empty'>暂无邀请记录</Text>}
        {rewards.map(r => (
          <View key={r.id} className='reward-item'>
            <Text className='reward-date'>{new Date(r.createdAt).toLocaleDateString()}</Text>
            <Text className={`reward-status ${r.status === 'PAID' ? 'paid' : 'pending'}`}>
              {r.status === 'PAID' ? `+¥${(r.netAmount / 100).toFixed(2)}` : '待发放'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
