import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => console.log('业务员端启动'))
  return children
}

export default App
