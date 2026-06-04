import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Input } from '@tarojs/components'
import './index.css'

export default function GatePage() {
  const [devCode, setDevCode] = useState('')
  const isDev = process.env.NODE_ENV === 'development'

  const handleDevEntry = () => {
    const code = devCode.trim() || 'staff-demo-001'
    Taro.setStorageSync('referrerStaffId', code)
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className='gate-page'>
      <View className='hero'>
        <Text className='logo'>网课超市</Text>
        <Text className='tagline'>先学后付 · 放心上课</Text>
      </View>

      <View className='card'>
        <Text className='card-icon'>📲</Text>
        <Text className='card-title'>请通过业务员邀请进入</Text>
        <Text className='card-desc'>
          本平台课程需通过业务员专属二维码报名，扫码后即可注册并选课。
        </Text>
      </View>

      <View className='steps'>
        <View className='step'><Text className='step-num'>1</Text><Text className='step-text'>联系业务员获取专属二维码</Text></View>
        <View className='step'><Text className='step-num'>2</Text><Text className='step-text'>扫码进入注册</Text></View>
        <View className='step'><Text className='step-num'>3</Text><Text className='step-text'>完成实名认证后选课</Text></View>
      </View>

      {isDev && (
        <View className='dev-entry'>
          <Text className='dev-title'>开发模式快速入口</Text>
          <Input
            className='dev-input'
            placeholder='业务员ID（默认 staff-demo-001）'
            value={devCode}
            onInput={e => setDevCode(e.detail.value)}
          />
          <Button className='dev-btn' onClick={handleDevEntry}>
            模拟扫码进入
          </Button>
        </View>
      )}
    </View>
  )
}
