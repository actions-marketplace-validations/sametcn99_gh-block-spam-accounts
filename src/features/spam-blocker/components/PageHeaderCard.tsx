import { Card, Space, Typography } from "antd";

export function PageHeaderCard() {
  return (
    <Card>
      <Space direction="vertical" size={4}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          GitHub Spam Account Blocker
        </Typography.Title>
        <Typography.Text type="secondary">
          Analyze followers and following accounts in your browser, review detections, and block
          selected spam accounts safely.
        </Typography.Text>
      </Space>
    </Card>
  );
}
