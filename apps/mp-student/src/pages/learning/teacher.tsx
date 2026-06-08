import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button, Image } from "@tarojs/components";
import { api } from "../../services/api";

export default function TeacherPage() {
  const router = useRouter();
  const courseId = router.params.courseId!;
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTeacherInfo(courseId)
      .then(setTeacher)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading)
    return (
      <View style={{ padding: "80px 24px", textAlign: "center" }}>
        <Text style={{ color: "#9ca3af", fontSize: "28px" }}>加载中...</Text>
      </View>
    );

  if (!teacher)
    return (
      <View style={{ padding: "80px 24px", textAlign: "center" }}>
        <Text style={{ color: "#9ca3af", fontSize: "28px" }}>暂无老师信息</Text>
      </View>
    );

  return (
    <View
      style={{
        minHeight: "100vh",
        background: "#f6f4ef",
        padding: "32px 24px",
      }}
    >
      <View
        style={{
          background: "#fff",
          borderRadius: "28px",
          padding: "32px 24px",
          marginBottom: "20px",
          boxShadow: "0 16px 34px rgba(73, 86, 113, 0.08)",
        }}
      >
        <View
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <View
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: "0",
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: "40px", fontWeight: "700" }}
            >
              {teacher.name?.[0] || "师"}
            </Text>
          </View>
          <View>
            <Text
              style={{
                display: "block",
                fontSize: "32px",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              {teacher.name}
            </Text>
            <Text
              style={{ display: "block", fontSize: "24px", color: "#6b7280" }}
            >
              {teacher.title || "授课老师"}
            </Text>
          </View>
        </View>

        {teacher.bio && (
          <Text
            style={{
              display: "block",
              fontSize: "24px",
              color: "#4b5563",
              lineHeight: "1.9",
            }}
          >
            {teacher.bio}
          </Text>
        )}
      </View>

      {teacher.qrCode && (
        <View
          style={{
            background: "#fff",
            borderRadius: "28px",
            padding: "32px 24px",
            marginBottom: "20px",
            textAlign: "center",
            boxShadow: "0 16px 34px rgba(73, 86, 113, 0.08)",
          }}
        >
          <Text
            style={{
              display: "block",
              fontSize: "28px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "20px",
            }}
          >
            扫码添加老师
          </Text>
          <Image
            src={teacher.qrCode}
            style={{ width: "320px", height: "320px", borderRadius: "16px" }}
            mode='aspectFit'
          />
          <Text
            style={{
              display: "block",
              fontSize: "22px",
              color: "#9ca3af",
              marginTop: "16px",
              lineHeight: "1.7",
            }}
          >
            长按二维码添加老师微信，获取学习资料
          </Text>
        </View>
      )}

      {teacher.phone && (
        <Button
          style={{
            width: "100%",
            height: "92px",
            lineHeight: "92px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #2563eb, #1748d6)",
            color: "#fff",
            fontSize: "28px",
            fontWeight: "700",
            border: "none",
          }}
          onClick={() => {
            Taro.makePhoneCall({ phoneNumber: teacher.phone });
          }}
        >
          拨打老师电话
        </Button>
      )}
    </View>
  );
}
