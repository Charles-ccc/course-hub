import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface UserState {
  token: string | null
  profile: any | null
  isLoggedIn: boolean
  setToken: (token: string) => void
  setProfile: (profile: any) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  token: Taro.getStorageSync('token') || null,
  profile: null,
  isLoggedIn: !!Taro.getStorageSync('token'),
  setToken: (token) => {
    Taro.setStorageSync('token', token)
    set({ token, isLoggedIn: true })
  },
  setProfile: (profile) => set({ profile }),
  logout: () => {
    Taro.removeStorageSync('token')
    set({ token: null, profile: null, isLoggedIn: false })
  },
}))
