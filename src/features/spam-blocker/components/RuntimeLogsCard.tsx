import { Card, List, Space, Tag, Typography } from "antd";
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

  return (
    <Card title="Runtime Logs">
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
    </Card>
  );
}
