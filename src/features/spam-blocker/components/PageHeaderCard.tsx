import { SafetyOutlined } from "@ant-design/icons";
import { Space, Tag, Typography } from "antd";
import type { CSSProperties } from "react";

const heroStyle: CSSProperties = {
  textAlign: "center",
  padding: "48px 16px 28px",
};

const iconWrapStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 64,
  height: 64,
  borderRadius: 16,
  background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(167, 139, 250, 0.08))",
  border: "1px solid rgba(124, 58, 237, 0.2)",
};

const iconStyle: CSSProperties = {
  fontSize: 28,
  color: "#a78bfa",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  letterSpacing: "-0.02em",
};

export function PageHeaderCard() {
  return (
    <header className="hero-section" style={heroStyle}>
      <Space direction="vertical" size={12} align="center">
        <div className="stagger-1">
          <div className="hero-icon-wrap" style={iconWrapStyle}>
            <SafetyOutlined className="hero-icon" style={iconStyle} />
          </div>
        </div>
        <Tag
          color="purple"
          className="stagger-2"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase" as const,
          }}
        >
          Open Source
        </Tag>
        <Typography.Title
          level={2}
          className="gradient-text stagger-3 hero-title"
          style={titleStyle}
        >
          GitHub Spam Account Blocker
        </Typography.Title>
        <Typography.Text
          type="secondary"
          className="stagger-4 hero-desc"
          style={{ maxWidth: 540, display: "inline-block", lineHeight: 1.7 }}
        >
          Analyze your followers and following in-browser, review spam detections with clear
          reasons, and block selected accounts — your token never leaves this tab. Prefer
          automation? The same detection flow can also run as a reusable GitHub Action.
        </Typography.Text>
      </Space>
    </header>
  );
}
