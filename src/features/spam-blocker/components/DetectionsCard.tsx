import type { TableColumnsType } from "antd";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";
import type { DetectionSensitivity, SpamDetection } from "../../../types/spam";

function getSensitivityMeta(sensitivity: DetectionSensitivity): { label: string; color: string } {
  if (sensitivity === "aggressive") {
    return { label: "Aggressive", color: "volcano" };
  }

  if (sensitivity === "conservative") {
    return { label: "Conservative", color: "green" };
  }

  return { label: "Balanced", color: "blue" };
}

const columns: TableColumnsType<SpamDetection> = [
  {
    title: "Login",
    key: "login",
    render: (_, detection) => (
      <Typography.Link
        href={`https://github.com/${detection.profile.login}`}
        target="_blank"
        rel="noreferrer"
      >
        @{detection.profile.login}
      </Typography.Link>
    ),
  },
  {
    title: "Profile summary",
    key: "profileSummary",
    render: (_, detection) => {
      const summary =
        detection.profile.bio ??
        detection.profile.name ??
        detection.profile.company ??
        detection.profile.location ??
        "No public bio or profile text";

      return <Typography.Text type="secondary">{summary}</Typography.Text>;
    },
  },
  {
    title: "Detection reasons",
    dataIndex: "matchedReasons",
    key: "matchedReasons",
    render: (matchedReasons: string[]) => (
      <Space wrap size={[6, 6]}>
        {matchedReasons.map((reason) => (
          <Tag key={reason} color="gold">
            {reason}
          </Tag>
        ))}
      </Space>
    ),
  },
];

export function DetectionsCard() {
  const detectionSensitivity = useSpamBlockerStore((state) => state.detectionSensitivity);
  const detections = useSpamBlockerStore((state) => state.detections);
  const selectedLogins = useSpamBlockerStore((state) => state.selectedLogins);
  const setSelectedLogins = useSpamBlockerStore((state) => state.setSelectedLogins);
  const selectAllDetections = useSpamBlockerStore((state) => state.selectAllDetections);
  const sensitivityMeta = getSensitivityMeta(detectionSensitivity);

  return (
    <Card title="Detected Accounts">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space>
          <Tag color={sensitivityMeta.color}>{`Detection Profile: ${sensitivityMeta.label}`}</Tag>
          <Typography.Text strong>{`Detected: ${detections.length}`}</Typography.Text>
          <Typography.Text>{`Selected: ${selectedLogins.length}`}</Typography.Text>
          <Button onClick={() => selectAllDetections()} disabled={detections.length === 0}>
            Select All
          </Button>
          <Button onClick={() => setSelectedLogins([])} disabled={selectedLogins.length === 0}>
            Clear Selection
          </Button>
        </Space>
        <Table<SpamDetection>
          rowKey={(detection) => detection.profile.login}
          columns={columns}
          dataSource={detections}
          locale={{ emptyText: "No detected accounts yet." }}
          rowSelection={{
            selectedRowKeys: selectedLogins,
            onChange: (keys) => {
              setSelectedLogins(keys.map((key) => String(key)));
            },
          }}
          pagination={{ pageSize: 8 }}
        />
      </Space>
    </Card>
  );
}
