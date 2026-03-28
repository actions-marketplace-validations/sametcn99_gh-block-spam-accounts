import { SafetyOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import type { CSSProperties } from "react";

const heroStyle: CSSProperties = {
  textAlign: "center",
  padding: "36px 16px 20px",
};

const iconStyle: CSSProperties = {
  fontSize: 36,
  color: "#818cf8",
};

export function PageHeaderCard() {
  return (
    <div style={heroStyle}>
      <Space direction="vertical" size={8} align="center">
        <SafetyOutlined style={iconStyle} />
        <Typography.Title level={2} style={{ margin: 0 }}>
          GitHub Spam Account Blocker
        </Typography.Title>
        <Typography.Text type="secondary" style={{ maxWidth: 520, display: "inline-block" }}>
          Analyze your followers and following in-browser, review spam detections with clear
          reasons, and block selected accounts — your token never leaves this tab. Prefer
          automation? The same detection flow can also run as a reusable GitHub Action.
        </Typography.Text>
      </Space>
    </div>
  );
}
