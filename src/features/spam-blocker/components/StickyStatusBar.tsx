import { Avatar, Space, Tag, Typography } from "antd";
import type { CSSProperties } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

const barStyle: CSSProperties = {
  position: "sticky",
  top: 60,
  zIndex: 99,
  background: "rgba(17, 24, 39, 0.88)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 12,
  border: "1px solid #1e293b",
  padding: "8px 14px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10,
  transition: "box-shadow 0.3s ease",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
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
    <div
      className="sticky-status-bar"
      role="status"
      aria-live="polite"
      aria-label="Analysis status"
      style={barStyle}
    >
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
