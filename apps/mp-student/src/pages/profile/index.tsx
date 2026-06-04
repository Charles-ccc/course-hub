import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { api } from '../../services/api'
import { useUserStore } from '../../store'
import './index.css'

export default function ProfilePage() {
  const { profile, isLoggedIn, logout, setProfile } = useUserStore()

  useEffect(() => {
    if (isLoggedIn && !profile) {
      api.getProfile().then(setProfile).catch(console.error)
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <View className='profile-page not-logged'>
        <Text className='hint'>登录后查看个人信息</Text>
        <Button className='login-btn' onClick={() => Taro.navigateTo({ url: '/pages/auth/login' })}>立即登录</Button>
      </View>
    )
  }

  return (
    <View className='profile-page'>
      <View className='user-card'>
        <View className='avatar'><Text className='avatar-text'>{profile?.realname?.[0] || '?'}</Text></View>
        <View className='user-info'>
          <Text className='name'>{profile?.realname || '未实名'}</Text>
          <Text className='phone'>{profile?.phone || '未绑定手机'}</Text>
        </View>
        {profile?.realnameVerified && <Text className='verified-badge'>✓ 已实名</Text>}
      </View>

      <View className='menu-list'>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/profile/referral' })}>
          <Text className='menu-label'>邀请好友赚奖励</Text>
          <Text className='menu-arrow'>→</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/order/list' })}>
          <Text className='menu-label'>我的课程</Text>
          <Text className='menu-arrow'>→</Text>
        </View>
        {!profile?.realnameVerified && (
          <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/auth/realname' })}>
            <Text className='menu-label menu-warn'>完成实名认证</Text>
            <Text className='menu-arrow'>→</Text>
          </View>
        )}
      </View>

      <Button className='logout-btn' onClick={() => { logout(); Taro.switchTab({ url: '/pages/index/index' }) }}>退出登录</Button>
    </View>
  )
}
