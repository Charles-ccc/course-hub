import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import './app.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch((options) => {
    // 解析二维码 scene 参数（格式: staffId=xxx 或 inv=xxx）
    const scene = options.scene ? decodeURIComponent(String(options.scene)) : ''
    const query = options.query || {}

    // 来自业务员二维码：?staff=xxx
    const staffId = query.staff || extractParam(scene, 'staff')
    // 来自学员邀请链接：?inv=xxx
    const inviterId = query.inv || extractParam(scene, 'inv')

    if (staffId) {
      Taro.setStorageSync('referrerStaffId', staffId)
    }
    if (inviterId) {
      Taro.setStorageSync('referrerStudentId', inviterId)
    }
  })

  return children
}

function extractParam(scene: string, key: string): string {
  const match = scene.match(new RegExp(`${key}=([^&]+)`))
  return match ? match[1] : ''
}

export default App
