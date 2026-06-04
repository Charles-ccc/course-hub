import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { api } from '../../services/api'

export default function CourseListPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (kw = '') => {
    setLoading(true)
    api.getCourses(kw).then((r: any) => setCourses(r.items)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <View style={{ background: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
      <View style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '48px', padding: '0 24px', height: '80px', marginBottom: '24px' }}>
        <Input style={{ flex: 1, fontSize: '28px' }} placeholder='搜索课程' value={keyword}
          onInput={e => setKeyword(e.detail.value)} onConfirm={() => load(keyword)} />
        <Text style={{ fontSize: '28px', color: '#4F46E5' }} onClick={() => load(keyword)}>搜索</Text>
      </View>
      {loading && <Text style={{ textAlign: 'center', color: '#999', fontSize: '28px', padding: '80px' }}>加载中...</Text>}
      <ScrollView scrollY>
        {courses.map(c => (
          <View key={c.id} style={{ background: '#fff', borderRadius: '24px', padding: '24px', marginBottom: '20px' }}
            onClick={() => Taro.navigateTo({ url: `/pages/course/detail?id=${c.id}` })}>
            <Text style={{ display: 'block', fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>{c.title}</Text>
            <Text style={{ display: 'block', fontSize: '24px', color: '#999', marginBottom: '16px' }}>{c.org?.name}</Text>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#4F46E5' }}>
                ¥{((c.price / c.periodCount) / 100).toFixed(0)}/期
              </Text>
              <Text style={{ fontSize: '24px', color: '#999' }}>共{c.periodCount}期</Text>
            </View>
          </View>
        ))}
        {!loading && courses.length === 0 && <Text style={{ textAlign: 'center', color: '#999', fontSize: '28px', padding: '80px' }}>暂无课程</Text>}
      </ScrollView>
    </View>
  )
}
