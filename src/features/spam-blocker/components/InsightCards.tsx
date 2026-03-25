import { Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function InsightCards() {
  const detections = useSpamBlockerStore((s) => s.detections);
  const selectedLogins = useSpamBlockerStore((s) => s.selectedLogins);
  const blockedUserLogins = useSpamBlockerStore((s) => s.blockedUserLogins);
  const detectionSensitivity = useSpamBlockerStore((s) => s.detectionSensitivity);
  const canReadBlockedUsers = useSpamBlockerStore((s) => s.canReadBlockedUsers);

  const reasonBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const detection of detections) {
      for (const reason of detection.matchedReasons) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [detections]);

  if (detections.length === 0) return null;

  const selectionRate =
    detections.length > 0 ? Math.round((selectedLogins.length / detections.length) * 100) : 0;

  return (
    <div className="fade-in">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Detected"
              value={detections.length}
              valueStyle={{ color: "#f59e0b", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Selected"
              value={selectedLogins.length}
              suffix={`(${selectionRate}%)`}
              valueStyle={{ color: "#6366f1", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Already Blocked"
              value={canReadBlockedUsers ? blockedUserLogins.length : "N/A"}
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Sensitivity"
              value={detectionSensitivity.charAt(0).toUpperCase() + detectionSensitivity.slice(1)}
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>
      {reasonBreakdown.length > 0 && (
        <Card size="small" style={{ marginTop: 12 }}>
          <Typography.Text strong style={{ marginBottom: 8, display: "block" }}>
            Top Detection Reasons
          </Typography.Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {reasonBreakdown.map(([reason, count]) => (
              <Tag key={reason} color="gold">
                {reason} ({count})
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
