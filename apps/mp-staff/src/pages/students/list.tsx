import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./list.css";

export default function StudentListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi
      .getStudents()
      .then((r) => setStudents(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STATUS_MAP: Record<string, string> = {
    ACTIVE: "学习中",
    COMPLETED: "已完成",
    COOLING_OFF: "冷静期",
    CREATED: "待签约",
    OVERDUE: "已逾期",
  };

  return (
    <View className='staff-students-page'>
      <Text className='staff-students-title'>我的学员（脱敏）</Text>
      <Text className='staff-students-subtitle'>
        只展示业务跟进需要的信息，避免页面噪声过多。
      </Text>
      {loading && <Text className='staff-students-loading'>加载中...</Text>}
      <ScrollView scrollY className='staff-students-list'>
        {students.map((s) => (
          <View key={s.id} className='staff-student-card'>
            <Text className='staff-student-name'>{s.realname}</Text>
            <Text className='staff-student-phone'>{s.phone}</Text>
            <View className='staff-student-order-list'>
              {(s.orders || []).map((o: any) => (
                <Text key={o.id} className='staff-student-chip'>
                  {STATUS_MAP[o.status] || o.status}
                </Text>
              ))}
            </View>
          </View>
        ))}
        {!loading && students.length === 0 && (
          <Text className='staff-students-empty'>暂无学员</Text>
        )}
      </ScrollView>
    </View>
  );
}
