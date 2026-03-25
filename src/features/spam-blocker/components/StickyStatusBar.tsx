import { Avatar, Space, Tag, Typography } from "antd";
import type { CSSProperties } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

const barStyle: CSSProperties = {
  position: "sticky",
  top: 72,
  zIndex: 99,
  background: "rgba(30, 41, 59, 0.92)",
  backdropFilter: "blur(12px)",
  borderRadius: 8,
  border: "1px solid #334155",
  padding: "10px 16px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
};

function statusColor(status: string): string {
  if (status === "running") return "processing";
  if (status === "completed") return "success";
  if (status === "error") return "error";
  return "default";
}

export function StickyStatusBar() {
  const authenticatedUser = useSpamBlockerStore((s) => s.authenticatedUser);
  const analysisStatus = useSpamBlockerStore((s) => s.analysisStatus);
  const analysisProgress = useSpamBlockerStore((s) => s.analysisProgress);
  const detections = useSpamBlockerStore((s) => s.detections);
  const selectedLogins = useSpamBlockerStore((s) => s.selectedLogins);
  const blockStatus = useSpamBlockerStore((s) => s.blockStatus);
  const blockProgress = useSpamBlockerStore((s) => s.blockProgress);
  const unblockStatus = useSpamBlockerStore((s) => s.unblockStatus);
  const rateLimit = useSpamBlockerStore((s) => s.rateLimit);
  const detectionSensitivity = useSpamBlockerStore((s) => s.detectionSensitivity);
  const canReadBlockedUsers = useSpamBlockerStore((s) => s.canReadBlockedUsers);

  if (!authenticatedUser) return null;

  return (
    <div style={barStyle}>
      <Space size={6}>
        <Avatar src={authenticatedUser.avatarUrl} size={22} />
        <Typography.Text strong style={{ fontSize: 13 }}>
          @{authenticatedUser.login}
        </Typography.Text>
      </Space>

      <Tag color={statusColor(analysisStatus)}>
        {analysisStatus === "idle"
          ? "Ready"
          : analysisStatus.charAt(0).toUpperCase() + analysisStatus.slice(1)}
      </Tag>

      {analysisProgress.candidateCount > 0 && (
        <Typography.Text style={{ fontSize: 12 }}>
          Candidates: {analysisProgress.candidateCount}
        </Typography.Text>
      )}

      {detections.length > 0 && <Tag color="volcano">Detected: {detections.length}</Tag>}

      {selectedLogins.length > 0 && <Tag color="purple">Selected: {selectedLogins.length}</Tag>}

      {blockStatus === "running" && (
        <Tag color="processing">
          Blocking: {blockProgress.completed}/{blockProgress.total}
        </Tag>
      )}

      {unblockStatus === "running" && <Tag color="processing">Unblocking</Tag>}

      {rateLimit && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          API: {rateLimit.remaining}/{rateLimit.limit}
        </Typography.Text>
      )}

      <Tag style={{ fontSize: 11 }}>
        {detectionSensitivity.charAt(0).toUpperCase() + detectionSensitivity.slice(1)}
      </Tag>

      {!canReadBlockedUsers && (
        <Tag color="warning" style={{ fontSize: 11 }}>
          Blocked list unavailable
        </Tag>
      )}
    </div>
  );
}
