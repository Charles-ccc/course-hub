import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, ScrollView, Video } from "@tarojs/components";
import { api } from "../../services/api";

export default function PlayerPage() {
  const router = useRouter();
  const courseId = router.params.courseId!;
  const orderId = router.params.orderId;
  const isTrial = router.params.trial === "1";
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCourseVideos(courseId)
      .then((data) => {
        const list = isTrial ? data.slice(0, 1) : data;
        setVideos(list);
        if (list.length > 0) {
          selectVideo(list[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  const selectVideo = async (video: any) => {
    setCurrentVideo(video);
    try {
      const url = await api.getVideoUrl(video.id);
      setVideoUrl(url);
    } catch (e) {
      Taro.showToast({ title: "视频加载失败", icon: "none" });
    }
  };

  if (loading)
    return (
      <View style={{ padding: "80px 24px", textAlign: "center" }}>
        <Text style={{ color: "#9ca3af", fontSize: "28px" }}>加载中...</Text>
      </View>
    );

  return (
    <View style={{ minHeight: "100vh", background: "#0f172a" }}>
      {isTrial && (
        <View
          style={{
            background: "#f59e0b",
            padding: "16px 24px",
            textAlign: "center",
          }}
        >
          <Text style={{ color: "#1f2937", fontSize: "26px", fontWeight: "700" }}>
            试学模式 · 仅展示第一节课程
          </Text>
        </View>
      )}

      {videoUrl ? (
        <Video
          src={videoUrl}
          style={{ width: "100%", height: "420px" }}
          controls
          autoplay={false}
          title={currentVideo?.title || ""}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "420px",
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: "28px" }}>
            选择课程开始播放
          </Text>
        </View>
      )}

      <View style={{ background: "#fff", minHeight: "calc(100vh - 420px)" }}>
        <View style={{ padding: "20px 24px 8px" }}>
          <Text
            style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937" }}
          >
            {currentVideo?.title || "课程视频"}
          </Text>
        </View>

        <ScrollView scrollY style={{ maxHeight: "50vh" }}>
          {videos.map((video, index) => (
            <View
              key={video.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #f3f4f6",
                background:
                  currentVideo?.id === video.id ? "#eff6ff" : "#fff",
              }}
              onClick={() => selectVideo(video)}
            >
              <View
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background:
                    currentVideo?.id === video.id ? "#2563eb" : "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  flexShrink: "0",
                }}
              >
                <Text
                  style={{
                    color: currentVideo?.id === video.id ? "#fff" : "#6b7280",
                    fontSize: "24px",
                    fontWeight: "700",
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={{ flex: "1" }}>
                <Text
                  style={{
                    display: "block",
                    fontSize: "26px",
                    color: "#1f2937",
                    fontWeight: currentVideo?.id === video.id ? "700" : "400",
                    marginBottom: "4px",
                  }}
                >
                  {video.title}
                </Text>
                {video.duration && (
                  <Text style={{ fontSize: "22px", color: "#9ca3af" }}>
                    {video.duration}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {isTrial && (
          <View style={{ padding: "24px" }}>
            <View
              style={{
                background: "#eff6ff",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid rgba(37, 99, 235, 0.2)",
              }}
            >
              <Text
                style={{
                  display: "block",
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "#1d4ed8",
                  marginBottom: "12px",
                }}
              >
                课程质量满意？立即报名
              </Text>
              <Text
                style={{
                  display: "block",
                  fontSize: "24px",
                  color: "#3b82f6",
                  lineHeight: "1.8",
                }}
              >
                完整课程包含更多精彩内容，报名后即可解锁全部课程视频。
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
