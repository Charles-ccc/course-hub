import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./list.css";

type TabKey = "all" | "due7" | "due" | "overdue";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "due7", label: "7天还款日" },
  { key: "due", label: "还款日" },
  { key: "overdue", label: "已逾期" },
];

const VISIBLE_STATUS: Record<string, string> = {
  ACTIVE: "学习中",
  COMPLETED: "已完成",
  OVERDUE: "已逾期",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "chip--active",
  COMPLETED: "chip--completed",
  OVERDUE: "chip--overdue",
};

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return `逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return "今日还款";
  if (diffDays <= 7) return `${diffDays} 天后还款`;
  return null;
}

export default function StudentListPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    staffApi
      .getStudents(1, tab)
      .then((r) => setStudents(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <View className='staff-students-page'>
      <Text className='staff-students-title'>我的学员</Text>

      <View className='staff-tab-row'>
        {TABS.map((t) => (
          <View
            key={t.key}
            className={`staff-tab-item${tab === t.key ? " staff-tab-item--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <Text className='staff-tab-label'>{t.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <Text className='staff-students-loading'>加载中...</Text>
      ) : null}

      <ScrollView scrollY className='staff-students-list'>
        {students.map((s) => {
          const order = (s.orders || [])[0];
          const statusLabel = order ? VISIBLE_STATUS[order.status] : null;
          const statusClass = order ? STATUS_COLOR[order.status] : "";
          const dueHint = order ? formatDueDate(order.nextDueDate) : null;
          const hasProgress =
            order &&
            order.periodCount > 0 &&
            typeof order.completedPeriods === "number";

          return (
            <View key={s.id} className='staff-student-card'>
              <View className='staff-student-card-header'>
                <View className='staff-student-info'>
                  <Text className='staff-student-name'>{s.realname}</Text>
                  <Text className='staff-student-phone'>{s.phone}</Text>
                </View>
                {statusLabel ? (
                  <View className={`staff-student-status-chip ${statusClass}`}>
                    <Text className='chip-text'>{statusLabel}</Text>
                  </View>
                ) : null}
              </View>

              <View className='staff-student-tags'>
                {hasProgress ? (
                  <View className='staff-tag staff-tag--progress'>
                    <Text className='staff-tag-text'>
                      已学完 {order.completedPeriods}/{order.periodCount} 期
                    </Text>
                  </View>
                ) : null}
                {dueHint ? (
                  <View
                    className={`staff-tag ${order.status === "OVERDUE" ? "staff-tag--overdue" : "staff-tag--due"}`}
                  >
                    <Text className='staff-tag-text'>{dueHint}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
        {!loading && students.length === 0 ? (
          <Text className='staff-students-empty'>
            {tab === "all"
              ? "暂无学员"
              : tab === "overdue"
                ? "暂无逾期学员"
                : "暂无符合条件的学员"}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
