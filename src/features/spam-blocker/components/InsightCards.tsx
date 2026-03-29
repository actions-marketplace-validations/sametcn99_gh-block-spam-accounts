import {
  AlertOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  RadarChartOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Skeleton, Statistic, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

const STAT_BORDER: Record<string, string> = {
  detected: "#f59e0b",
  selected: "#a78bfa",
  blocked: "#ef4444",
  sensitivity: "#7c3aed",
};

export function InsightCards() {
  const detections = useSpamBlockerStore((s) => s.detections);
  const selectedLogins = useSpamBlockerStore((s) => s.selectedLogins);
  const blockedUserLogins = useSpamBlockerStore((s) => s.blockedUserLogins);
  const detectionSensitivity = useSpamBlockerStore((s) => s.detectionSensitivity);
  const canReadBlockedUsers = useSpamBlockerStore((s) => s.canReadBlockedUsers);
  const analysisStatus = useSpamBlockerStore((s) => s.analysisStatus);

  const reasonBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const detection of detections) {
      for (const reason of detection.matchedReasons) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [detections]);

  if (detections.length === 0 && analysisStatus === "running") {
    return (
      <div className="card-enter">
        <Row gutter={[12, 12]}>
          {[
            STAT_BORDER.detected,
            STAT_BORDER.selected,
            STAT_BORDER.blocked,
            STAT_BORDER.sensitivity,
          ].map((color) => (
            <Col xs={12} sm={6} key={color}>
              <Card size="small" style={{ borderTop: `2px solid ${color}` }}>
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (detections.length === 0) return null;

  const selectionRate =
    detections.length > 0 ? Math.round((selectedLogins.length / detections.length) * 100) : 0;

  const maxReasonCount = reasonBreakdown.length > 0 ? reasonBreakdown[0][1] : 1;

  return (
    <div className="card-enter">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: `2px solid ${STAT_BORDER.detected}` }}>
            <Statistic
              title="Detected"
              value={detections.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: "#f59e0b", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: `2px solid ${STAT_BORDER.selected}` }}>
            <Statistic
              title="Selected"
              value={selectedLogins.length}
              prefix={<CheckCircleOutlined />}
              suffix={`(${selectionRate}%)`}
              valueStyle={{ color: "#a78bfa", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: `2px solid ${STAT_BORDER.blocked}` }}>
            <Statistic
              title="Already Blocked"
              value={canReadBlockedUsers ? blockedUserLogins.length : "N/A"}
              prefix={<StopOutlined />}
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: `2px solid ${STAT_BORDER.sensitivity}` }}>
            <Statistic
              title="Sensitivity"
              value={detectionSensitivity.charAt(0).toUpperCase() + detectionSensitivity.slice(1)}
              prefix={<EyeOutlined />}
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>
      {reasonBreakdown.length > 0 && (
        <Card
          size="small"
          style={{ marginTop: 12 }}
          title={
            <span>
              <RadarChartOutlined style={{ color: "#7c3aed", marginRight: 8 }} />
              Top Detection Reasons
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reasonBreakdown.map(([reason, count]) => (
              <div
                key={reason}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Tag color="gold" style={{ minWidth: 24, textAlign: "center" }}>
                  {count}
                </Tag>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(124, 58, 237, 0.15)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(count / maxReasonCount) * 100}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                        transition: "width 0.4s ease-out",
                      }}
                    />
                  </div>
                </div>
                <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 200 }}>
                  {reason}
                </Typography.Text>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
