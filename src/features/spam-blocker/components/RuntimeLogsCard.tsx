import { Badge, Collapse, List, Space, Tag, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";
import "./RuntimeLogsCard.css";

function levelToColor(level: string): string {
  if (level === "success") {
    return "green";
  }

  if (level === "warning") {
    return "orange";
  }

  if (level === "error") {
    return "red";
  }

  return "blue";
}

export function RuntimeLogsCard() {
  const logs = useSpamBlockerStore((state) => state.logs);

  const logItems = [...logs].reverse();
  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warning").length;

  const badgeCount = errorCount > 0 ? errorCount : warnCount;
  const badgeColor = errorCount > 0 ? "#ef4444" : warnCount > 0 ? "#f59e0b" : undefined;

  const label = (
    <Space>
      <Typography.Text strong>Runtime Logs</Typography.Text>
      {logs.length > 0 && (
        <Badge count={badgeCount || logs.length} color={badgeColor ?? "#6366f1"} size="small" />
      )}
    </Space>
  );

  return (
    <Collapse
      ghost
      items={[
        {
          key: "logs",
          label,
          children: (
            <div className="runtimeLogsScrollContainer">
              <List
                size="small"
                dataSource={logItems}
                locale={{ emptyText: "Runtime logs will appear here." }}
                renderItem={(logItem) => (
                  <List.Item>
                    <Space direction="vertical" size={0} style={{ width: "100%" }}>
                      <Space wrap>
                        <Tag color={levelToColor(logItem.level)}>{logItem.level.toUpperCase()}</Tag>
                        <Tag>{logItem.stage.toUpperCase()}</Tag>
                        <Typography.Text type="secondary">{logItem.timestampIso}</Typography.Text>
                      </Space>
                      <Typography.Text>{logItem.message}</Typography.Text>
                      {logItem.details ? (
                        <Typography.Text type="secondary">{logItem.details}</Typography.Text>
                      ) : null}
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
