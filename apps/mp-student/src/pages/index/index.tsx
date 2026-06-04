import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { api } from '../../services/api'
import { useUserStore } from '../../store'
import './index.css'

export default function IndexPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const isLoggedIn = useUserStore(s => s.isLoggedIn)

  useEffect(() => {
    // 检查是否有业务员来源，无来源跳引导页
    const staffId = Taro.getStorageSync('referrerStaffId')
    if (!staffId) {
      Taro.redirectTo({ url: '/pages/gate/index' })
      return
    }
    loadCourses()
  }, [])

  const loadCourses = async (kw = '') => {
    setLoading(true)
    try {
      const res = await api.getCourses(kw)
      setCourses(res.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => loadCourses(keyword)

  const goToCourse = (id: string) => {
    if (!isLoggedIn) {
      return Taro.navigateTo({ url: '/pages/auth/login' })
    }
    Taro.navigateTo({ url: `/pages/course/detail?id=${id}` })
  }

  return (
    <View className='index-page'>
      <View className='search-bar'>
        <Input className='search-input' placeholder='搜索课程' value={keyword}
          onInput={e => setKeyword(e.detail.value)} onConfirm={handleSearch} />
        <Text className='search-btn' onClick={handleSearch}>搜索</Text>
      </View>

      <View className='section-title'>
        <Text>热门课程</Text>
      </View>

      <ScrollView className='course-list' scrollY>
        {loading && <View className='loading'><Text>加载中...</Text></View>}
        {courses.map(course => (
          <View key={course.id} className='course-card' onClick={() => goToCourse(course.id)}>
            <View className='course-info'>
              <Text className='course-title'>{course.title}</Text>
              <Text className='course-org'>{course.org?.name}</Text>
              <View className='course-price-row'>
                <View className='price-tag'>
                  <Text className='period-count'>{course.periodCount}期</Text>
                  <Text className='period-amount'>¥{((course.price / course.periodCount) / 100).toFixed(0)}/期</Text>
                </View>
                <Text className='total-price'>总价 ¥{(course.price / 100).toFixed(0)}</Text>
              </View>
            </View>
            <View className='badge'>先学后付</View>
          </View>
        ))}
        {!loading && courses.length === 0 && (
          <View className='empty'><Text>暂无课程</Text></View>
        )}
      </ScrollView>
    </View>
  )
}
