import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { staffApi } from "../../services/api";
import "./index.css";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待结算",
  SETTLED: "已结算",
  HELD: "暂缓",
  CLAWED_BACK: "已扣回",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F59E0B",
  SETTLED: "#10B981",
  HELD: "#3B82F6",
  CLAWED_BACK: "#EF4444",
};

export default function CommissionPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    staffApi.getCommissionDashboard().then(setData).catch(console.error);
  }, []);

  return (
    <View className='staff-commission-page'>
      <Text className='staff-commission-title'>提成看板</Text>
      <Text className='staff-commission-subtitle'>
        把已结算、待结算和暂缓状态拆开，减少人工判断成本。
      </Text>
      <View className='staff-commission-metrics'>
        {[
          { label: "已结算", value: data?.settled, color: "#10B981" },
          { label: "待结算", value: data?.pending, color: "#F59E0B" },
          { label: "暂缓", value: data?.held, color: "#3B82F6" },
        ].map((item) => (
          <View key={item.label} className='staff-commission-metric'>
            <Text
              className='staff-commission-metric-value'
              style={{ color: item.color }}
            >
              ¥{((item.value || 0) / 100).toFixed(0)}
            </Text>
            <Text className='staff-commission-metric-label'>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text className='staff-commission-section-title'>明细记录</Text>
      <ScrollView scrollY className='staff-commission-list'>
        {(data?.records || []).map((r: any) => (
          <View key={r.id} className='staff-commission-record'>
            <View>
              <Text className='staff-commission-record-title'>
                {r.type === "CLOSING"
                  ? "成单提成"
                  : `履约提成（第${r.periodNo}期）`}
              </Text>
              <Text className='staff-commission-record-date'>
                {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className='staff-commission-record-right'>
              <Text className='staff-commission-record-amount'>
                ¥{(r.amount / 100).toFixed(2)}
              </Text>
              <Text
                className='staff-commission-record-status'
                style={{ color: STATUS_COLOR[r.status] }}
              >
                {STATUS_LABEL[r.status]}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
